import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_HISTORY_ITEMS } from '../constants/config';
import { deleteAllImages, deleteImage } from './imageService';

const STORAGE_KEY = '@plantscanner/history';

/**
 * A scan record looks like:
 * {
 *   id: string,
 *   imageUri: string,         // file in the app's document directory
 *   createdAt: string,        // ISO date
 *   matches: PlantMatch[],    // best match first (see plantNetApi.js)
 * }
 */

export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Failed to read history', error);
    return [];
  }
}

export async function addToHistory(record) {
  const history = await getHistory();
  const updated = [record, ...history.filter((item) => item.id !== record.id)];

  // Drop the oldest scans (and their photos) once we exceed the cap.
  const overflow = updated.splice(MAX_HISTORY_ITEMS);
  overflow.forEach((item) => deleteImage(item.imageUri));

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeFromHistory(id) {
  const history = await getHistory();
  const target = history.find((item) => item.id === id);
  const updated = history.filter((item) => item.id !== id);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (target) {
    deleteImage(target.imageUri);
  }
  return updated;
}

export async function clearHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  deleteAllImages();
  return [];
}

export function createScanId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
