'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { createScanImages, loadImage, validateImageFile } from './imageUtils';
import { setPendingScan } from './scanStorage';

/**
 * Turns a camera frame or an uploaded file into a pending scan, which the
 * scanner card on the home page previews until the user taps "Identify plant".
 * Options: `navigate` (go home afterwards; false when already there), `replace`
 * (replace the history entry instead of pushing), and `origin` ('camera' |
 * 'upload') so the preview can offer Retake vs Change image.
 */
export function useStartScan() {
  const router = useRouter();
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState(null);

  const startFromSource = useCallback(
    (source, { navigate = true, replace = false, origin = 'upload', file = null } = {}) => {
      setPendingScan({
        ...createScanImages(source),
        origin,
        fileName: file?.name ?? null,
        fileSize: file?.size ?? null,
      });
      if (!navigate) return;
      if (replace) router.replace('/');
      else router.push('/');
    },
    [router]
  );

  const startFromFile = useCallback(
    async (file, options) => {
      if (!file) return;
      setIsPreparing(true);
      setError(null);
      try {
        validateImageFile(file);
        const image = await loadImage(file);
        startFromSource(image, { ...options, file });
        image.close?.(); // free ImageBitmap memory
      } catch (err) {
        setError(err.message || 'Could not read that photo.');
      } finally {
        setIsPreparing(false);
      }
    },
    [startFromSource]
  );

  return { startFromSource, startFromFile, isPreparing, error };
}
