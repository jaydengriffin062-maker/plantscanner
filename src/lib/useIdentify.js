'use client';

import { ImageOff, SearchX, ServerCrash, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { dataUrlToBlob } from './imageUtils';
import { addToHistory, clearPendingScan, createScanId, saveLastResult } from './scanStorage';

/** Turns a failed request into a friendly title + icon for the error state. */
function describeFailure({ status, message }) {
  if (status === 0) {
    return { icon: WifiOff, title: "You're offline", message: 'Check your internet connection, then try again.' };
  }
  if (status === 400 || status === 413 || status === 415) {
    return { icon: ImageOff, title: "This photo can't be used", message };
  }
  if (status === 404) {
    return { icon: SearchX, title: 'No plant detected', message };
  }
  return {
    icon: ServerCrash,
    title: 'Identification is unavailable',
    message: message || 'Something went wrong on our side. Please try again in a moment.',
  };
}

/**
 * Sends the pending photo to /api/identify, saves the result to history and
 * opens it. Returns { identify, isScanning, problem, clearProblem }.
 */
export function useIdentify() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [failure, setFailure] = useState(null); // { status, message }
  // A ref (not state) so a double tap can't start two requests before re-render.
  const scanningRef = useRef(false);

  const identify = async (pending) => {
    if (!pending || scanningRef.current) return;
    scanningRef.current = true;
    setIsScanning(true);
    setFailure(null);
    try {
      const form = new FormData();
      form.append('image', await dataUrlToBlob(pending.uploadDataUrl), 'plant.jpg');

      let response;
      try {
        response = await fetch('/api/identify', { method: 'POST', body: form });
      } catch {
        throw { status: 0 };
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw { status: response.status, message: body?.error };
      }

      const record = {
        id: createScanId(),
        createdAt: new Date().toISOString(),
        imageDataUrl: pending.thumbnailDataUrl,
        matches: body.matches,
        genus: body.genus ?? null,
        provider: body.provider,
      };
      saveLastResult(record);
      addToHistory(record);
      router.push(`/plant?id=${encodeURIComponent(record.id)}`);
      clearPendingScan();
    } catch (err) {
      setFailure({ status: err?.status ?? 500, message: err?.message });
      scanningRef.current = false;
      setIsScanning(false);
    }
  };

  return {
    identify,
    isScanning,
    problem: failure && describeFailure(failure),
    clearProblem: () => setFailure(null),
  };
}
