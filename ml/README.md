# Botanical Vision classifier

Trains, evaluates and serves the plant species classifier used by the web app.
The dataset ([`dbabnigg/botanical-vision-256`](https://huggingface.co/datasets/dbabnigg/botanical-vision-256),
4,094 species, ~407k images) and trained weights are **never committed**; see `.gitignore`.

```
image ─► preprocessing ─► ConvNeXt-Tiny classifier ─► top-k species + taxonomy ─► /api/identify ─► results page
```

| File | Purpose |
| --- | --- |
| `config.py` | Dataset id, default hyperparameters, output paths |
| `dataset.py` | Loads splits from the HF cache, builds the label → species/taxonomy map, transforms |
| `model.py` | timm model creation, export/load of the inference folder, accuracy helper |
| `train.py` | Transfer-learning fine-tune on **train**, model selection on **val**, checkpoints + resume |
| `evaluate.py` | Final metrics on the held-out **test** split (only used here) |
| `inference.py` | `PlantClassifier` + CLI for one image |
| `export_onnx.py` | Exports `best/` to the int8 `model/plant-classifier.onnx` the Vercel function runs |
| `serve.py` | Optional FastAPI service (used when `INFERENCE_API_URL` is set) |
| `Dockerfile` | CPU image of that service for a separate model host |

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows (source .venv/bin/activate elsewhere)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
pip install -r ml/requirements.txt
python download_dataset.py        # once; fills ~/.cache/huggingface (~8.7 GB)
```

All commands run from the repository root.

## 1. Pipeline check (minutes)

```bash
python -m ml.train --max-classes 50 --epochs 4 --output-dir ml/models/dev-run
```

`--max-classes` / `--limit-train` / `--limit-val` are for development only.

## 2. Full training

```bash
python -m ml.train --epochs 12 --batch-size 64 --workers 6 --output-dir ml/models/botanical-convnext-tiny
```

- Every epoch writes `checkpoints/last.pt` and appends to `history.jsonl`.
- Whenever val top-1 improves, `best/` is re-exported (`model.safetensors`, `config.json`, `labels.json`).
- Interrupted? Re-run the same command with `--resume`.

## 3. Test-set evaluation

```bash
python -m ml.evaluate --model-dir ml/models/botanical-convnext-tiny/best
```

Writes `best/test_metrics.json`. Use these test numbers when reporting accuracy; don't tune hyperparameters on them.

## 4. Inference

```bash
python -m ml.inference photo.jpg --model-dir ml/models/botanical-convnext-tiny/best
```

```json
{ "predictions": [ { "species": "Acer palmatum", "confidence": 0.53, "species_key": "3189882",
                     "genus": "Acer", "family": "Sapindaceae", "order": "Sapindales", "class": "Magnoliopsida" }, … ] }
```

## 5. Ship to the website (default)

```bash
python -m ml.export_onnx --model-dir ml/models/botanical-convnext-tiny/best
```

Writes `model/plant-classifier.onnx` (int8, ~31 MB), `model/labels.json` and `model/config.json`, and prints how
often the int8 model agrees with PyTorch on val. Commit `model/` and push; Vercel runs it in `/api/identify`.

## 6. Separate inference service (optional)

```bash
MODEL_DIR=ml/models/botanical-convnext-tiny/best INFERENCE_API_TOKEN=change-me uvicorn ml.serve:app --port 8000
```

Then in `.env.local`: `INFERENCE_API_URL=http://localhost:8000` and the same `INFERENCE_API_TOKEN`.

Use this for a bigger model than fits in a Vercel function: build `ml/Dockerfile`, host it
(Hugging Face Spaces, Render, Fly.io, Cloud Run…) and set `INFERENCE_API_URL` / `INFERENCE_API_TOKEN` in Vercel.

## Confidence

The web app shows **Plant identified** at ≥70%, **Possible match** at 40–70%, and below 40% shows
"We couldn't confidently identify this plant" with the top 3 candidates (`src/components/ConfidenceBar.js`).
After full training, check these thresholds against the val split and adjust them if needed.
