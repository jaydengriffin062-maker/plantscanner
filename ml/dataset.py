"""Botanical Vision loading, label mapping and preprocessing.

The dataset is read from the local Hugging Face cache (populated by
download_dataset.py); nothing is re-downloaded if the cache is present.
"""

import json
from pathlib import Path

import torch
from torchvision import transforms

from .config import DATASET_ID, TAXONOMY_FIELDS


def load_splits(split=None):
    """Returns the DatasetDict (or one split) from the HF cache."""
    # Imported here so the inference service doesn't need the `datasets` package.
    from datasets import load_dataset

    return load_dataset(DATASET_ID, split=split)


def class_names(hf_split):
    return list(hf_split.features["label"].names)


def build_label_map(train_split):
    """Builds [{index, species, species_key, genus, family, order, class}] from the
    train split's text columns (images are not decoded)."""
    names = class_names(train_split)
    columns = train_split.select_columns(["label", *TAXONOMY_FIELDS]).to_pandas()
    first_rows = columns.drop_duplicates("label").set_index("label")

    labels = []
    for index, name in enumerate(names):
        entry = {"index": index, "species": name}
        if index in first_rows.index:
            row = first_rows.loc[index]
            if row["species"] != name:
                raise ValueError(f"Label {index} is '{name}' but rows say '{row['species']}'")
            for key in TAXONOMY_FIELDS[1:]:
                value = row[key]
                entry[key] = None if value is None or value != value else str(value)  # NaN -> None
        else:
            # Class has no training images: keep the name, never invent taxonomy.
            entry.update({key: None for key in TAXONOMY_FIELDS[1:]})
        labels.append(entry)
    return labels


def save_label_map(labels, path):
    Path(path).write_text(json.dumps(labels, indent=1, ensure_ascii=False), encoding="utf-8")


def load_label_map(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def build_transforms(img_size, mean, std, train):
    normalize = transforms.Normalize(mean=mean, std=std)
    if train:
        return transforms.Compose([
            transforms.RandomResizedCrop(img_size, scale=(0.35, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(0.2, 0.2, 0.2),
            transforms.ToTensor(),
            normalize,
        ])
    # Dataset images are 256px, so this is the standard 256 -> 224 centre crop.
    return transforms.Compose([
        transforms.Resize(int(round(img_size / 0.875))),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        normalize,
    ])


def first_classes(hf_split, max_classes):
    """Keeps only rows whose label is < max_classes (for quick development runs)."""
    if not max_classes:
        return hf_split
    return hf_split.filter(lambda labels: [l < max_classes for l in labels], input_columns="label", batched=True)


def random_subset(hf_split, limit, seed):
    if not limit or limit >= len(hf_split):
        return hf_split
    return hf_split.shuffle(seed=seed).select(range(limit))


class BotanicalTorchDataset(torch.utils.data.Dataset):
    """Wraps one HF split; images are decoded lazily in DataLoader workers."""

    def __init__(self, hf_split, transform):
        self.split = hf_split.select_columns(["image", "label"])
        self.transform = transform

    def __len__(self):
        return len(self.split)

    def __getitem__(self, index):
        row = self.split[index]
        image = row["image"].convert("RGB")
        return self.transform(image), row["label"]
