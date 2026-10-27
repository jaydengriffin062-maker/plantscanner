'use client';

import { useEffect, useState } from 'react';

/**
 * Loads common name, description and reference photos for a species from
 * /api/plant-info. Pass null to skip (e.g. for low-confidence results).
 * Returns { status: 'idle' | 'loading' | 'ready' | 'error', data }.
 */
export function usePlantInfo(scientificName) {
  const [state, setState] = useState({ name: null, status: 'idle', data: null });

  useEffect(() => {
    if (!scientificName) return undefined;
    const controller = new AbortController();
    fetch(`/api/plant-info?name=${encodeURIComponent(scientificName)}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data) => setState({ name: scientificName, status: 'ready', data }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ name: scientificName, status: 'error', data: null });
      });
    return () => controller.abort();
  }, [scientificName]);

  if (!scientificName) return { status: 'idle', data: null };
  if (state.name !== scientificName) return { status: 'loading', data: null };
  return state;
}
