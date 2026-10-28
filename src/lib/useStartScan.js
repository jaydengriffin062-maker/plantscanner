'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { createScanImages, loadImage, validateImageFile } from './imageUtils';
import { setPendingScan } from './scanStorage';

/**
 * Turns a camera frame or an uploaded file into a pending scan and opens the
 * /identify page, where the user previews it and confirms with "Scan plant".
 * `origin` ('camera' | 'upload') lets that page offer Retake vs Replace.
 */
export function useStartScan() {
  const router = useRouter();
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState(null);

  const startFromSource = useCallback(
    (source, { replace = false, origin = 'upload' } = {}) => {
      setPendingScan({ ...createScanImages(source), origin });
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
        validateImageFile(file);
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
