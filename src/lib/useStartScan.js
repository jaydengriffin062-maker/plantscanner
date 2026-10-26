'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { createScanImages, loadImage } from './imageUtils';
import { setPendingScan } from './scanStorage';

/**
 * Turns a camera frame or an uploaded file into a pending scan and opens the
 * /identify page, which sends it to the API.
 */
export function useStartScan() {
  const router = useRouter();
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState(null);

  const startFromSource = useCallback(
    (source, { replace = false } = {}) => {
      setPendingScan(createScanImages(source));
      if (replace) router.replace('/identify');
      else router.push('/identify');
    },
    [router]
  );

  const startFromFile = useCallback(
    async (file, options) => {
      if (!file) return;
      setIsPreparing(true);
      setError(null);
      try {
        const image = await loadImage(file);
        startFromSource(image, options);
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
