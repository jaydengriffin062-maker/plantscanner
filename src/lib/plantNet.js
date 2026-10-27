// Server-only Pl@ntNet client. The API key never leaves the server.

import { IdentificationError } from './identificationError';

const PLANTNET_URL = 'https://my-api.plantnet.org/v2/identify/all';
const MAX_RESULTS = 4;
const TIMEOUT_MS = 25000;

/**
 * Sends one image to Pl@ntNet and returns normalised matches, best first.
 * Matches use the PlantMatch shape described in lib/botanicalModel.js.
 */
export async function identifyWithPlantNet(image, apiKey) {
  const query = new URLSearchParams({
    'api-key': apiKey,
    lang: 'en',
    'nb-results': String(MAX_RESULTS),
    'include-related-images': 'false',
  });

  const form = new FormData();
  form.append('images', image, 'plant.jpg');
  // "auto" lets Pl@ntNet detect whether the photo shows a leaf, flower, fruit...
  form.append('organs', 'auto');

  let response;
  try {
    response = await fetch(`${PLANTNET_URL}?${query}`, {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      throw new IdentificationError('Pl@ntNet took too long to respond. Please try again.', 504);
    }
    throw new IdentificationError('Could not reach Pl@ntNet. Please try again.', 502);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new IdentificationError(messageForStatus(response.status, body), statusForClient(response.status));
  }

  const matches = (body?.results ?? []).map(normalizeResult);
  if (matches.length === 0) {
    throw new IdentificationError(NOT_FOUND_MESSAGE, 404);
  }

  return { matches, remainingRequests: body?.remainingIdentificationRequests ?? null };
}

const NOT_FOUND_MESSAGE =
  "We couldn't recognise a plant in this photo. Try a closer, well-lit shot of a single leaf or flower.";

function normalizeResult(result) {
  const species = result.species ?? {};
  const scientificName =
    species.scientificNameWithoutAuthor || species.scientificName || 'Unknown species';

  return {
    commonName: species.commonNames?.[0] || null,
    otherCommonNames: species.commonNames?.slice(1, 4) ?? [],
    scientificName,
    family: species.family?.scientificNameWithoutAuthor ?? null,
    genus: species.genus?.scientificNameWithoutAuthor ?? null,
    // Pl@ntNet doesn't return order or class.
    order: null,
    taxonClass: null,
    confidence: Math.round((result.score ?? 0) * 1000) / 10, // one decimal place
    gbifId: result.gbif?.id ?? null,
  };
}

function messageForStatus(status, body) {
  switch (status) {
    case 400:
      return 'The photo could not be processed. Try a different image.';
    case 401:
    case 403:
      return 'The server\'s Pl@ntNet API key was rejected. Check PLANTNET_API_KEY in your Vercel settings.';
    case 404:
      return NOT_FOUND_MESSAGE;
    case 413:
      return 'The photo is too large to upload.';
    case 429:
      return "Today's free Pl@ntNet identification limit has been reached. Please try again tomorrow.";
    default:
      return body?.message || `Pl@ntNet returned an unexpected error (${status}).`;
  }
}

// Key problems are our server's fault, not the user's request.
function statusForClient(status) {
  if (status === 401 || status === 403) return 500;
  return status >= 400 && status < 600 ? status : 502;
}
