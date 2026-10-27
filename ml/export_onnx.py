"""Exports a trained model to an int8 ONNX file that the Vercel function runs directly.

    python -m ml.export_onnx --model-dir ml/models/botanical-convnext-tiny/best

Writes model/plant-classifier.onnx, model/labels.json and model/config.json (committed,
~30 MB), then checks the quantized model against PyTorch on a random val subset.
"""

import argparse
import json
import tempfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic

from .config import ML_DIR
from .dataset import BotanicalTorchDataset, build_transforms, load_splits, random_subset
from .model import load_exported_model

DEFAULT_OUT = ML_DIR.parent / "model"
ONNX_FILE = "plant-classifier.onnx"


def export(model, img_size, out_path):
    dummy = torch.randn(1, 3, img_size, img_size)
    with tempfile.TemporaryDirectory() as tmp:
        fp32 = Path(tmp) / "fp32.onnx"
        torch.onnx.export(
            model, dummy, fp32, input_names=["input"], output_names=["logits"],
            opset_version=17, dynamo=False,
        )
        # Linear layers hold most ConvNeXt weights; int8 weights shrink the file ~4x.
        quantize_dynamic(fp32, out_path, weight_type=QuantType.QInt8)


def compare(model, onnx_path, config, limit, seed):
    split = random_subset(load_splits("val"), limit, seed)
    data = BotanicalTorchDataset(split, build_transforms(config["img_size"], config["mean"], config["std"], train=False))
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    agree = torch_ok = onnx_ok = 0
    with torch.inference_mode():
        for i in range(len(data)):
            x, y = data[i]
            t = model(x.unsqueeze(0)).argmax(1).item()
            o = int(np.argmax(session.run(None, {"input": x.unsqueeze(0).numpy()})[0]))
            agree += t == o
            torch_ok += t == y
            onnx_ok += o == y
    n = len(data)
    return {"samples": n, "top1_agreement": agree / n, "torch_top1": torch_ok / n, "onnx_int8_top1": onnx_ok / n}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model-dir", required=True)
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT))
    parser.add_argument("--check-samples", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    model, config, labels = load_exported_model(args.model_dir, "cpu")
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    onnx_path = out / ONNX_FILE
    export(model, config["img_size"], onnx_path)

    (out / "labels.json").write_text(json.dumps(labels, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    check = compare(model, onnx_path, config, args.check_samples, args.seed)
    web_config = {
        "model_name": config["model_name"],
        "img_size": config["img_size"],
        "resize": int(round(config["img_size"] / 0.875)),
        "mean": config["mean"],
        "std": config["std"],
        "metrics": config.get("metrics", {}),
        "onnx_check": check,
    }
    (out / "config.json").write_text(json.dumps(web_config, indent=2), encoding="utf-8")
    print(json.dumps(check, indent=2))
    print(f"Wrote {onnx_path} ({onnx_path.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
