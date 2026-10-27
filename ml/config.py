"""Shared settings for training, evaluation and inference."""

from dataclasses import asdict, dataclass, field
from pathlib import Path

DATASET_ID = "dbabnigg/botanical-vision-256"

# Taxonomy columns stored alongside each image in the dataset.
TAXONOMY_FIELDS = ("species", "species_key", "genus", "family", "order", "class")

ML_DIR = Path(__file__).resolve().parent
# Ignored by git via the `models/` rule in .gitignore.
DEFAULT_OUTPUT_ROOT = ML_DIR / "models"

# Files written for a trained model. Inference only needs this folder.
WEIGHTS_FILE = "model.safetensors"
MODEL_CONFIG_FILE = "config.json"
LABELS_FILE = "labels.json"


@dataclass
class TrainConfig:
    # ConvNeXt-Tiny pretrained on ImageNet-22k then fine-tuned on ImageNet-1k:
    # strong fine-grained transfer, 28M params, fits an 8 GB GPU at batch 64.
    model_name: str = "convnext_tiny.fb_in22k_ft_in1k"
    img_size: int = 224
    epochs: int = 12
    batch_size: int = 64
    lr: float = 5e-4
    weight_decay: float = 0.05
    warmup_epochs: float = 1.0
    label_smoothing: float = 0.1
    drop_path_rate: float = 0.1
    workers: int = 6
    seed: int = 42
    amp: bool = True
    freeze_backbone: bool = False
    # Optional random subsets for quick pipeline checks (None = full split).
    limit_train: int | None = None
    limit_val: int | None = None
    # Dev only: keep just the first N species so a short run shows real learning.
    max_classes: int | None = None
    output_dir: str = field(default_factory=lambda: str(DEFAULT_OUTPUT_ROOT / "botanical-convnext-tiny"))

    def to_dict(self):
        return asdict(self)
