"""Fine-tunes a pretrained vision backbone on Botanical Vision.

Quick pipeline check (50 species, a few minutes):
    python -m ml.train --max-classes 50 --epochs 3 --output-dir ml/models/dev-run

Full training: see ml/README.md. Uses train for fitting and val for model
selection; the test split is reserved for ml/evaluate.py.
"""

import argparse
import json
import math
import random
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from tqdm import tqdm

from .config import TrainConfig
from .dataset import (
    BotanicalTorchDataset,
    build_label_map,
    build_transforms,
    first_classes,
    load_splits,
    random_subset,
)
from .evaluate import evaluate_loader
from .model import create_model, export_model, normalization_for


def parse_args():
    defaults = TrainConfig()
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--model-name", default=defaults.model_name, help="Any timm model id.")
    p.add_argument("--img-size", type=int, default=defaults.img_size)
    p.add_argument("--epochs", type=int, default=defaults.epochs)
    p.add_argument("--batch-size", type=int, default=defaults.batch_size)
    p.add_argument("--lr", type=float, default=defaults.lr)
    p.add_argument("--weight-decay", type=float, default=defaults.weight_decay)
    p.add_argument("--warmup-epochs", type=float, default=defaults.warmup_epochs)
    p.add_argument("--label-smoothing", type=float, default=defaults.label_smoothing)
    p.add_argument("--drop-path-rate", type=float, default=defaults.drop_path_rate)
    p.add_argument("--workers", type=int, default=defaults.workers)
    p.add_argument("--seed", type=int, default=defaults.seed)
    p.add_argument("--no-amp", dest="amp", action="store_false")
    p.add_argument("--freeze-backbone", action="store_true", help="Train only the new classifier head.")
    p.add_argument("--limit-train", type=int, default=None, help="Random train subset size.")
    p.add_argument("--limit-val", type=int, default=None, help="Random val subset size.")
    p.add_argument("--max-classes", type=int, default=None, help="Dev only: use just the first N species.")
    p.add_argument("--output-dir", default=defaults.output_dir)
    p.add_argument("--resume", action="store_true", help="Continue from <output-dir>/checkpoints/last.pt")
    args = p.parse_args()
    return TrainConfig(**{k: v for k, v in vars(args).items() if k != "resume"}), args.resume


def seed_everything(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def main():
    cfg, resume = parse_args()
    seed_everything(cfg.seed)
    out_dir = Path(cfg.output_dir)
    ckpt_dir = out_dir / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if device.type == "cuda" else ""))
    torch.backends.cudnn.benchmark = True
    use_amp = cfg.amp and device.type == "cuda"

    # Only train and val are loaded here; test stays untouched until evaluate.py.
    train_split = load_splits("train")
    val_split = load_splits("val")
    labels = build_label_map(train_split)
    num_classes = len(labels)
    print(f"Classes: {num_classes} | train: {len(train_split)} | val: {len(val_split)}")

    model = create_model(cfg.model_name, num_classes, pretrained=True, drop_path_rate=cfg.drop_path_rate)
    mean, std = normalization_for(model)
    if cfg.freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False
        for param in model.get_classifier().parameters():
            param.requires_grad = True
    model.to(device, memory_format=torch.channels_last)

    train_set = BotanicalTorchDataset(
        random_subset(first_classes(train_split, cfg.max_classes), cfg.limit_train, cfg.seed),
        build_transforms(cfg.img_size, mean, std, train=True),
    )
    val_set = BotanicalTorchDataset(
        random_subset(first_classes(val_split, cfg.max_classes), cfg.limit_val, cfg.seed),
        build_transforms(cfg.img_size, mean, std, train=False),
    )
    loader_kwargs = dict(
        num_workers=cfg.workers,
        pin_memory=device.type == "cuda",
        persistent_workers=cfg.workers > 0,
    )
    train_loader = torch.utils.data.DataLoader(
        train_set, batch_size=cfg.batch_size, shuffle=True, drop_last=True, **loader_kwargs
    )
    val_loader = torch.utils.data.DataLoader(val_set, batch_size=cfg.batch_size * 2, **loader_kwargs)
    print(f"Using {len(train_set)} train / {len(val_set)} val images")

    params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(params, lr=cfg.lr, weight_decay=cfg.weight_decay)
    steps_per_epoch = len(train_loader)
    total_steps = max(1, cfg.epochs * steps_per_epoch)
    warmup_steps = int(cfg.warmup_epochs * steps_per_epoch)

    def lr_lambda(step):
        if step < warmup_steps:
            return (step + 1) / warmup_steps
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1 + math.cos(math.pi * min(1.0, progress)))

    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

    start_epoch, best_top1 = 0, -1.0
    last_ckpt = ckpt_dir / "last.pt"
    if resume:
        if not last_ckpt.exists():
            raise SystemExit(f"--resume given but {last_ckpt} does not exist")
        state = torch.load(last_ckpt, map_location="cpu", weights_only=False)
        model.load_state_dict(state["model"])
        optimizer.load_state_dict(state["optimizer"])
        scheduler.load_state_dict(state["scheduler"])
        start_epoch, best_top1 = state["epoch"] + 1, state["best_top1"]
        print(f"Resumed from epoch {state['epoch'] + 1}, best val top-1 {best_top1:.4f}")

    (out_dir / "train_config.json").write_text(json.dumps(cfg.to_dict(), indent=2), encoding="utf-8")
    history_path = out_dir / "history.jsonl"
    autocast = torch.autocast(device_type=device.type, dtype=torch.bfloat16, enabled=use_amp)

    for epoch in range(start_epoch, cfg.epochs):
        model.train()
        started = time.time()
        running_loss, seen = 0.0, 0
        bar = tqdm(train_loader, desc=f"epoch {epoch + 1}/{cfg.epochs}")
        for images, targets in bar:
            images = images.to(device, non_blocking=True).to(memory_format=torch.channels_last)
            targets = targets.to(device, non_blocking=True)
            with autocast:
                logits = model(images)
            loss = F.cross_entropy(logits.float(), targets, label_smoothing=cfg.label_smoothing)

            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(params, 1.0)
            optimizer.step()
            scheduler.step()

            running_loss += loss.item() * targets.size(0)
            seen += targets.size(0)
            bar.set_postfix(loss=f"{running_loss / seen:.3f}", lr=f"{scheduler.get_last_lr()[0]:.2e}")

        val = evaluate_loader(model, val_loader, device, amp=use_amp, desc="val")
        record = {
            "epoch": epoch + 1,
            "train_loss": running_loss / max(seen, 1),
            "val_loss": val["loss"],
            "val_top1": val["top1"],
            "val_top5": val["top5"],
            "minutes": round((time.time() - started) / 60, 2),
        }
        if device.type == "cuda":
            record["peak_vram_gb"] = round(torch.cuda.max_memory_allocated() / 1024**3, 2)
        print(json.dumps(record))
        with history_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

        if val["top1"] > best_top1:
            best_top1 = val["top1"]
            export_model(
                model, labels, out_dir / "best",
                model_name=cfg.model_name, img_size=cfg.img_size, mean=mean, std=std,
                metrics={"epoch": epoch + 1, "val_top1": val["top1"], "val_top5": val["top5"]},
            )
            print(f"New best model (val top-1 {best_top1:.4f}) exported to {out_dir / 'best'}")

        torch.save(
            {
                "model": model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "scheduler": scheduler.state_dict(),
                "epoch": epoch,
                "best_top1": best_top1,
                "config": cfg.to_dict(),
            },
            last_ckpt,
        )

    print(f"Done. Best val top-1: {best_top1:.4f}. Next: python -m ml.evaluate --model-dir {out_dir / 'best'}")


if __name__ == "__main__":
    main()
