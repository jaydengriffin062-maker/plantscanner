"""HTTP inference service the Next.js app calls (via INFERENCE_API_URL).

    MODEL_DIR=ml/models/botanical-convnext-tiny/best uvicorn ml.serve:app --port 8000

POST /predict   multipart field "image" (JPEG/PNG/WebP)  ->  {"predictions": [...], "model": {...}}
GET  /health

If INFERENCE_API_TOKEN is set, requests must send "Authorization: Bearer <token>".
"""

import os
import secrets

from fastapi import FastAPI, File, Header, HTTPException, Query, UploadFile
from PIL import UnidentifiedImageError

from .inference import PlantClassifier

MAX_UPLOAD_BYTES = 8 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

MODEL_DIR = os.environ.get("MODEL_DIR", "ml/models/botanical-convnext-tiny/best")
API_TOKEN = os.environ.get("INFERENCE_API_TOKEN")

app = FastAPI(title="Plant Scanner inference")
classifier = PlantClassifier(MODEL_DIR, device=os.environ.get("INFERENCE_DEVICE"))


def check_token(authorization):
    if not API_TOKEN:
        return
    expected = f"Bearer {API_TOKEN}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing token.")


@app.get("/health")
def health():
    return {"status": "ok", "model": classifier.config["model_name"], "classes": len(classifier.labels)}


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    top_k: int = Query(3, ge=1, le=10),
    authorization: str | None = Header(default=None),
):
    check_token(authorization)
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Please upload a JPEG, PNG or WebP photo.")
    data = await image.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="The photo is too large.")
    try:
        result = classifier.predict(data, top_k=top_k)
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="The photo could not be read.")
    result["model"] = {
        "name": classifier.config["model_name"],
        "dataset": "dbabnigg/botanical-vision-256",
    }
    return result
