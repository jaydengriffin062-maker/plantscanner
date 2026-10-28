// Server-only: runs the Botanical Vision classifier inside the Vercel function
// with ONNX Runtime. The int8 model in /model is produced by ml/export_onnx.py.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import * as ort from 'onnxruntime-node';
import sharp from 'sharp';

import { GENUS_CONFIDENCE, MEDIUM_CONFIDENCE } from '@/components/ConfidenceBar';

import { normalizePrediction } from './botanicalModel';
import { IdentificationError } from './identificationError';

const MODEL_DIR = path.join(process.cwd(), 'model');
const MODEL_FILE = path.join(MODEL_DIR, 'plant-classifier.onnx');
const TOP_K = 3;

// Hide ONNX Runtime's harmless "Failed to persist telemetry device ID" warning on
// Vercel's read-only filesystem, so real problems stand out in the logs.
ort.env.logLevel = 'error';

export function hasLocalModel() {
  return existsSync(MODEL_FILE);
}

// Loaded once per function instance and reused across requests.
let modelPromise = null;
function loadModel() {
  modelPromise ??= (async () => {
    const [config, labels, session] = await Promise.all([
      readFile(path.join(MODEL_DIR, 'config.json'), 'utf8').then(JSON.parse),
      readFile(path.join(MODEL_DIR, 'labels.json'), 'utf8').then(JSON.parse),
      ort.InferenceSession.create(MODEL_FILE, { executionProviders: ['cpu'] }),
    ]);
    return { config, labels, session };
  })().catch((error) => {
    modelPromise = null; // allow a retry on the next request
    throw error;
  });
  return modelPromise;
}

/**
 * Same preprocessing as training evaluation (ml/dataset.py): resize the shorter
 * side to `resize`, centre-crop `img_size`, scale to 0-1, normalise, CHW float32.
 */
async function toTensor(buffer, { resize, img_size: size, mean, std }) {
  let decoded;
  try {
    decoded = await sharp(buffer)
      .rotate() // apply EXIF orientation
      .removeAlpha()
      .toColourspace('srgb')
      .resize({ width: resize, height: resize, fit: 'outside', kernel: 'linear' })
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new IdentificationError('The photo could not be read.', 400);
  }

  const { data, info } = decoded;
  const left = Math.floor((info.width - size) / 2);
  const top = Math.floor((info.height - size) / 2);
  const plane = size * size;
  const tensor = new Float32Array(3 * plane);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const src = ((top + y) * info.width + (left + x)) * info.channels;
      const dst = y * size + x;
      for (let c = 0; c < 3; c++) {
        tensor[c * plane + dst] = (data[src + c] / 255 - mean[c]) / std[c];
      }
    }
  }
  return new ort.Tensor('float32', tensor, [1, 3, size, size]);
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

/** The genus whose species together have the highest probability. */
function bestGenus(probs, labels) {
  const totals = new Map();
  probs.forEach((p, i) => totals.set(labels[i].genus, (totals.get(labels[i].genus) ?? 0) + p));
  let best = null;
  for (const [name, probability] of totals) {
    if (!best || probability > best.probability) best = { name, probability };
  }
  const example = labels.find((label) => label.genus === best.name);
  return {
    name: best.name,
    family: example.family ?? null,
    order: example.order ?? null,
    taxonClass: example.class ?? null,
    confidence: Math.round(best.probability * 1000) / 10,
  };
}

/**
 * Returns { matches, genus? } with matches in the PlantMatch shape (see lib/botanicalModel.js).
 * `genus` is only set when no species reaches MEDIUM_CONFIDENCE but one genus
 * reaches GENUS_CONFIDENCE.
 */
export async function identifyWithLocalModel(image) {
  const { config, labels, session } = await loadModel();
  const input = await toTensor(Buffer.from(await image.arrayBuffer()), config);
  const { logits } = await session.run({ input });

  const probs = softmax(Array.from(logits.data));
  const ranked = Array.from(probs.keys()).sort((a, b) => probs[b] - probs[a]);
  const matches = ranked
    .slice(0, TOP_K)
    .map((index) => normalizePrediction({ ...labels[index], confidence: probs[index] }));

  // Sums over all 4,094 species, so it can find a likely genus the top 3 alone would miss.
  const result = { matches };
  if (probs[ranked[0]] * 100 < MEDIUM_CONFIDENCE) {
    const genus = bestGenus(probs, labels);
    if (genus.confidence >= GENUS_CONFIDENCE) result.genus = genus;
  }
  return result;
}
