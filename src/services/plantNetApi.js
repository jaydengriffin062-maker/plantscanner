import {
  MAX_RESULTS,
  PLANTNET_API_KEY,
  PLANTNET_BASE_URL,
  PLANTNET_PROJECT,
  REQUEST_TIMEOUT_MS,
} from '../constants/config';

export class PlantNetError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'PlantNetError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Sends a photo to the Pl@ntNet identification API.
 *
 * @param {string} imageUri Local file URI (file://...) of a JPEG image.
 * @returns {Promise<{ matches: Array<PlantMatch>, remainingRequests: number | null }>}
 *
 * PlantMatch: { commonName, scientificName, family, genus, confidence (0-100), gbifId }
 */
export async function identifyPlant(imageUri) {
  if (!PLANTNET_API_KEY) {
    throw new PlantNetError(
      'No Pl@ntNet API key found. Add EXPO_PUBLIC_PLANTNET_API_KEY to your .env file and restart Expo.',
      { code: 'missing_key' }
    );
  }

  const query = new URLSearchParams({
    'api-key': PLANTNET_API_KEY,
    lang: 'en',
    'nb-results': String(MAX_RESULTS),
    'include-related-images': 'false',
  });
  const url = `${PLANTNET_BASE_URL}/${PLANTNET_PROJECT}?${query.toString()}`;

  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } objects for files.
  form.append('images', { uri: imageUri, name: 'plant.jpg', type: 'image/jpeg' });
  // "auto" lets Pl@ntNet detect whether the photo shows a leaf, flower, fruit...
  form.append('organs', 'auto');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new PlantNetError('The identification request timed out. Please try again.', {
        code: 'timeout',
      });
    }
    throw new PlantNetError('Could not reach Pl@ntNet. Check your internet connection.', {
      code: 'network',
    });
  } finally {
    clearTimeout(timeout);
  }

  const body = await safeJson(response);

  if (!response.ok) {
    throw new PlantNetError(messageForStatus(response.status, body), {
      status: response.status,
      code: response.status === 404 ? 'not_found' : 'api_error',
    });
  }

  const matches = (body?.results ?? []).map(normalizeResult);
  if (matches.length === 0) {
    throw new PlantNetError(
      "We couldn't recognise a plant in this photo. Try a closer, well-lit shot of a leaf or flower.",
      { code: 'not_found' }
    );
  }

  return {
    matches,
    remainingRequests: body?.remainingIdentificationRequests ?? null,
  };
}

function normalizeResult(result) {
  const species = result.species ?? {};
  const scientificName =
    species.scientificNameWithoutAuthor || species.scientificName || 'Unknown species';
  const commonName = species.commonNames?.[0] || scientificName;

  return {
    commonName,
    otherCommonNames: species.commonNames?.slice(1, 4) ?? [],
    scientificName,
    family: species.family?.scientificNameWithoutAuthor ?? null,
    genus: species.genus?.scientificNameWithoutAuthor ?? null,
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
      return 'Your Pl@ntNet API key was rejected. Check the key in your .env file and its settings on my.plantnet.org.';
    case 404:
      return "We couldn't recognise a plant in this photo. Try a closer, well-lit shot of a leaf or flower.";
    case 413:
      return 'The photo is too large to upload.';
    case 429:
      return "You've reached today's free Pl@ntNet identification limit. Please try again tomorrow.";
    default:
      return body?.message || `Pl@ntNet returned an unexpected error (${status}).`;
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
