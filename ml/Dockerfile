# CPU inference service for a dedicated model host (Hugging Face Spaces, Render, Fly.io, Cloud Run...).
# Build from the repository root after training:
#   docker build -f ml/Dockerfile --build-arg MODEL_DIR=ml/models/botanical-convnext-tiny/best -t plantscanner-inference .
FROM python:3.12-slim

WORKDIR /app
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir timm safetensors pillow fastapi "uvicorn[standard]" python-multipart

# Only the inference code and the exported model are shipped (no dataset).
COPY ml/__init__.py ml/config.py ml/dataset.py ml/model.py ml/inference.py ml/serve.py ./ml/
ARG MODEL_DIR=ml/models/botanical-convnext-tiny/best
COPY ${MODEL_DIR} ./model

ENV MODEL_DIR=/app/model PORT=7860
EXPOSE 7860
CMD ["sh", "-c", "uvicorn ml.serve:app --host 0.0.0.0 --port ${PORT}"]
