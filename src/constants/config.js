// Central app configuration. Values prefixed with EXPO_PUBLIC_ are read from
// .env at build time and inlined into the JavaScript bundle.

export const PLANTNET_API_KEY = process.env.EXPO_PUBLIC_PLANTNET_API_KEY ?? '';

export const PLANTNET_BASE_URL = 'https://my-api.plantnet.org/v2/identify';

// "all" searches the global flora. Swap for a regional project (e.g. "weurope")
// if your users are concentrated in one area.
export const PLANTNET_PROJECT = 'all';

// Number of candidate species to request from the API.
export const MAX_RESULTS = 4;

// Request timeout for identification calls, in milliseconds.
export const REQUEST_TIMEOUT_MS = 30000;

// Longest image edge (px) sent to the API. Smaller uploads are faster and
// Pl@ntNet does not need full-resolution photos.
export const UPLOAD_MAX_DIMENSION = 1280;

// Maximum number of scans kept in local history.
export const MAX_HISTORY_ITEMS = 100;
