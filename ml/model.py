"""Model construction and the exported-model folder format."""

import json
from pathlib import Path

import timm
import torch
from safetensors.torch import load_file, save_file

from .config import LABELS_FILE, MODEL_CONFIG_FILE, WEIGHTS_FILE
from .dataset import load_label_map, save_label_map


def create_model(model_name, num_classes, pretrained=True, drop_path_rate=0.0):
    """Pretrained backbone with a fresh classification head (transfer learning)."""
    return timm.create_model(
        model_name,
        pretrained=pretrained,
        num_classes=num_classes,
        drop_path_rate=drop_path_rate,
    )


def normalization_for(model):
    cfg = timm.data.resolve_data_config({}, model=model)
    return list(cfg["mean"]), list(cfg["std"])


def export_model(model, labels, out_dir, *, model_name, img_size, mean, std, metrics=None):
    """Writes weights + config + labels: everything inference needs, nothing else."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    state = {k: v.detach().cpu().contiguous() for k, v in model.state_dict().items()}
    save_file(state, out / WEIGHTS_FILE)
    save_label_map(labels, out / LABELS_FILE)
    config = {
        "model_name": model_name,
        "num_classes": len(labels),
        "img_size": img_size,
        "mean": mean,
        "std": std,
        "metrics": metrics or {},
    }
    (out / MODEL_CONFIG_FILE).write_text(json.dumps(config, indent=2), encoding="utf-8")


def load_exported_model(model_dir, device="cpu"):
    """Returns (model in eval mode, config dict, labels list)."""
    model_dir = Path(model_dir)
    config = json.loads((model_dir / MODEL_CONFIG_FILE).read_text(encoding="utf-8"))
    labels = load_label_map(model_dir / LABELS_FILE)
    model = create_model(config["model_name"], config["num_classes"], pretrained=False)
    model.load_state_dict(load_file(model_dir / WEIGHTS_FILE, device="cpu"))
    model.to(device).eval()
    return model, config, labels


@torch.no_grad()
def topk_accuracy(logits, targets, ks=(1, 5)):
    max_k = min(max(ks), logits.shape[1])
    _, pred = logits.topk(max_k, dim=1)
    correct = pred.eq(targets.unsqueeze(1))
    return {k: correct[:, : min(k, max_k)].any(dim=1).sum().item() for k in ks}
