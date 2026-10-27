'use client';

import { useSyncExternalStore } from 'react';

// Scan history lives in localStorage so it can be viewed offline. Each record:
// {
//   id: string,
//   createdAt: string,          // ISO date
//   imageDataUrl: string,       // JPEG of the user's photo (<= 720px)
//   matches: PlantMatch[],      // best match first (see lib/botanicalModel.js)
//   provider?: string,          // 'botanical-vision' | 'plantnet' (missing on old scans)
// }
//
// The photo waiting to be identified is passed between pages in sessionStorage.

const HISTORY_KEY = 'plantscanner:history';
const PENDING_KEY = 'plantscanner:pending';
const LAST_RESULT_KEY = 'plantscanner:last-result';
const MAX_HISTORY_ITEMS = 50;

const EMPTY = [];
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readRaw(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

// useSyncExternalStore needs a stable snapshot, so each key remembers the last
// raw string it parsed and returns the same object until the string changes.
const parsedCache = new Map();
function readParsed(storage, key, fallback) {
  const raw = readRaw(storage, key);
  if (raw === null) return fallback;
  const cached = parsedCache.get(key);
  if (cached?.raw === raw) return cached.value;

  let value = fallback;
  try {
    value = JSON.parse(raw);
  } catch {
    // Corrupt data: treat as empty.
  }
  parsedCache.set(key, { raw, value });
  return value;
}

export function getHistory() {
  return readParsed(localStorage, HISTORY_KEY, EMPTY);
}

function writeHistory(history) {
  // Thumbnails are small, but if storage is full drop the oldest scans until it fits.
  let items = history.slice(0, MAX_HISTORY_ITEMS);
  while (items.length > 0) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
      emit();
      return true;
    } catch {
      items = items.slice(0, -1);
    }
  }
  return false;
}

export function addToHistory(record) {
  return writeHistory([record, ...getHistory().filter((item) => item.id !== record.id)]);
}

/** Applies `changes(record)` to one saved scan, e.g. to add a looked-up common name. */
export function updateInHistory(id, changes) {
  const history = getHistory();
  if (!history.some((item) => item.id === id)) return;
  writeHistory(history.map((item) => (item.id === id ? { ...item, ...changes(item) } : item)));
}

export function removeFromHistory(id) {
  writeHistory(getHistory().filter((item) => item.id !== id));
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore: nothing to clear.
  }
  emit();
}

/** Returns the history array, or null while rendering on the server. */
export function useHistory() {
  return useSyncExternalStore(subscribe, getHistory, () => null);
}

/** Finds a scan in history, falling back to the latest result in this tab. */
export function findScan(id) {
  const fromHistory = getHistory().find((item) => item.id === id);
  if (fromHistory) return fromHistory;
  const last = readParsed(sessionStorage, LAST_RESULT_KEY, null);
  return last?.id === id ? last : null;
}

export function saveLastResult(record) {
  try {
    sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify(record));
  } catch {
    // Not critical.
  }
}

/** Stores the photo that the /identify page should send to the API. */
export function setPendingScan(scan) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(scan));
  emit();
}

export function clearPendingScan() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Ignore.
  }
  emit();
}

function getPendingScan() {
  return readParsed(sessionStorage, PENDING_KEY, null);
}

/** Returns the pending scan, null if there is none, or undefined on the server. */
export function usePendingScan() {
  return useSyncExternalStore(subscribe, getPendingScan, () => undefined);
}

export function createScanId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
