// Server-only client for the Botanical Vision classifier (ml/serve.py), hosted
// separately from Vercel and reached through INFERENCE_API_URL.

import { IdentificationError } from './identificationError';

const TOP_K = 3;
// Hosted models on free tiers can cold-start, so allow a generous timeout.
const TIMEOUT_MS = 45000;

/**
 * Sends one image to the inference service and returns normalised matches, best first.
 * PlantMatch: { commonName, otherCommonNames, scientificName, genus, family, order,
 *               taxonClass, confidence (0-100), gbifId }
 */
export async function identifyWithBotanicalModel(image, { url, token }) {
  const form = new FormData();
  form.append('image', image, 'plant.jpg');

  const endpoint = new URL('predict', url.endsWith('/') ? url : `${url}/`);
  endpoint.searchParams.set('top_k', String(TOP_K));

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: form,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      throw new IdentificationError('The plant recognition service took too long to respond. Please try again.', 504);
    }
    throw new IdentificationError('Could not reach the plant recognition service. Please try again.', 502);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new IdentificationError('The server could not authenticate with the plant recognition service.', 500);
    }
    if (response.status === 400 || response.status === 413 || response.status === 415) {
      throw new IdentificationError(body?.detail || 'The photo could not be processed.', response.status);
    }
    throw new IdentificationError('The plant recognition service is unavailable. Please try again.', 502);
  }

  const matches = (body?.predictions ?? []).map(normalizePrediction);
  if (matches.length === 0) {
    throw new IdentificationError('The plant recognition service returned no predictions.', 502);
  }
  return { matches };
}

/** Maps one {species, confidence (0-1), species_key, genus, family, order, class} prediction to a PlantMatch. */
export function normalizePrediction(prediction) {
  const gbifId = /^\d+$/.test(prediction.species_key ?? '') ? prediction.species_key : null;
  return {
    // The model only knows taxonomy; common names come from the plant information service.
    commonName: null,
    otherCommonNames: [],
    scientificName: prediction.species,
    genus: prediction.genus ?? null,
    family: prediction.family ?? null,
    order: prediction.order ?? null,
    taxonClass: prediction.class ?? null,
    confidence: Math.round((prediction.confidence ?? 0) * 1000) / 10,
    gbifId,
  };
}
