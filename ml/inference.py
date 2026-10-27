"""Classifies ONE plant photo with an exported model.

    python -m ml.inference path/to/photo.jpg --model-dir ml/models/botanical-convnext-tiny/best

Prints {"predictions": [{"species", "confidence", "species_key", "genus", "family", "order", "class"}, ...]}
"""

import argparse
import io
import json
from pathlib import Path

import torch
from PIL import Image, ImageOps

from .config import TAXONOMY_FIELDS
from .dataset import build_transforms
from .model import load_exported_model


class PlantClassifier:
    def __init__(self, model_dir, device=None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model, self.config, self.labels = load_exported_model(model_dir, self.device)
        self.transform = build_transforms(
            self.config["img_size"], self.config["mean"], self.config["std"], train=False
        )

    @staticmethod
    def _open(image):
        if isinstance(image, Image.Image):
            img = image
        elif isinstance(image, (bytes, bytearray)):
            img = Image.open(io.BytesIO(image))
        else:
            img = Image.open(Path(image))
        # Phone photos store rotation in EXIF; apply it so the model sees the plant upright.
        return ImageOps.exif_transpose(img).convert("RGB")

    @torch.inference_mode()
    def predict(self, image, top_k=3):
        tensor = self.transform(self._open(image)).unsqueeze(0).to(self.device)
        probs = self.model(tensor).float().softmax(dim=1)[0]
        scores, indices = probs.topk(min(top_k, probs.numel()))
        predictions = []
        for score, index in zip(scores.tolist(), indices.tolist()):
            label = self.labels[index]
            prediction = {"species": label["species"], "confidence": round(score, 4)}
            prediction.update({key: label.get(key) for key in TAXONOMY_FIELDS[1:]})
            predictions.append(prediction)
        return {"predictions": predictions}


def main():
    parser = argparse.ArgumentParser(description="Identify a plant in one photo.")
    parser.add_argument("image")
    parser.add_argument("--model-dir", default="ml/models/botanical-convnext-tiny/best")
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()
    result = PlantClassifier(args.model_dir).predict(args.image, args.top_k)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
