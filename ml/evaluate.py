"""Final evaluation of an exported model on the held-out TEST split.

    python -m ml.evaluate --model-dir ml/models/botanical-convnext-tiny/best

The test split is only ever used here, never during training or model selection.
"""

import argparse
import json
import time
from pathlib import Path

import torch
import torch.nn.functional as F
from tqdm import tqdm

from .dataset import BotanicalTorchDataset, build_transforms, load_splits, random_subset
from .model import load_exported_model, topk_accuracy


@torch.no_grad()
def evaluate_loader(model, loader, device, amp=True, desc="eval"):
    model.eval()
    total, loss_sum, hits = 0, 0.0, {1: 0, 5: 0}
    autocast = torch.autocast(device_type=device.type, dtype=torch.bfloat16, enabled=amp and device.type == "cuda")
    for images, targets in tqdm(loader, desc=desc, leave=False):
        images = images.to(device, non_blocking=True).to(memory_format=torch.channels_last)
        targets = targets.to(device, non_blocking=True)
        with autocast:
            logits = model(images)
        loss_sum += F.cross_entropy(logits.float(), targets, reduction="sum").item()
        for k, v in topk_accuracy(logits, targets).items():
            hits[k] += v
        total += targets.numel()
    return {
        "samples": total,
        "loss": loss_sum / max(total, 1),
        "top1": hits[1] / max(total, 1),
        "top5": hits[5] / max(total, 1),
    }


def main():
    parser = argparse.ArgumentParser(description="Evaluate an exported model on the test split.")
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--limit", type=int, default=None, help="Random test subset for quick checks.")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, config, _ = load_exported_model(args.model_dir, device)
    model.to(memory_format=torch.channels_last)

    test = random_subset(load_splits("test"), args.limit, args.seed)
    transform = build_transforms(config["img_size"], config["mean"], config["std"], train=False)
    loader = torch.utils.data.DataLoader(
        BotanicalTorchDataset(test, transform),
        batch_size=args.batch_size,
        num_workers=args.workers,
        pin_memory=device.type == "cuda",
    )

    start = time.time()
    metrics = evaluate_loader(model, loader, device, desc="test")
    metrics["seconds"] = round(time.time() - start, 1)
    metrics["subset"] = args.limit

    out = Path(args.model_dir) / "test_metrics.json"
    out.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
