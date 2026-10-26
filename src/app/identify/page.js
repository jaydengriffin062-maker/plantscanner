'use client';

import { Camera, CircleAlert, LoaderCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import EmptyState from '@/components/EmptyState';
import { dataUrlToBlob } from '@/lib/imageUtils';
import {
  addToHistory,
  clearPendingScan,
  createScanId,
  saveLastResult,
  usePendingScan,
} from '@/lib/scanStorage';

export default function IdentifyPage() {
  const router = useRouter();
  const pending = usePendingScan();
  const [error, setError] = useState(null);
  // Prevents a second API call when React re-runs effects in development.
  const startedRef = useRef(false);
  // Set once the result page is opening, so clearing the pending scan doesn't redirect home.
  const doneRef = useRef(false);

  const identify = useCallback(
    async (scan) => {
      setError(null);
      try {
        const form = new FormData();
        form.append('image', await dataUrlToBlob(scan.uploadDataUrl), 'plant.jpg');

        const response = await fetch('/api/identify', { method: 'POST', body: form });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.error || `Identification failed (${response.status}).`);
        }

        const record = {
          id: createScanId(),
          createdAt: new Date().toISOString(),
          imageDataUrl: scan.thumbnailDataUrl,
          matches: body.matches,
        };
        saveLastResult(record);
        addToHistory(record);
        doneRef.current = true;
        router.replace(`/plant?id=${encodeURIComponent(record.id)}`);
        clearPendingScan();
      } catch (err) {
        setError(
          err instanceof TypeError
            ? 'Could not reach the server. Check your internet connection.'
            : err.message
        );
      }
    },
    [router]
  );

  useEffect(() => {
    if (pending === null) {
      if (!doneRef.current) router.replace('/'); // nothing to identify
      return;
    }
    if (pending && !startedRef.current) {
      startedRef.current = true;
      identify(pending);
    }
  }, [pending, identify, router]);

  if (error) {
    return (
      <main className="page page--center">
        <EmptyState icon={CircleAlert} title="Identification failed" message={error}>
          <button type="button" className="button button--primary" onClick={() => identify(pending)}>
            <RotateCcw size={20} aria-hidden />
            Try again
          </button>
          <Link href="/camera" replace className="button button--secondary">
            <Camera size={20} aria-hidden />
            Take a new photo
          </Link>
        </EmptyState>
      </main>
    );
  }

  return (
    <main className="identify">
      {pending?.uploadDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
        <img src={pending.uploadDataUrl} alt="" className="identify__backdrop" />
      )}
      <div className="identify__card" role="status">
        <LoaderCircle className="spin text-primary" size={44} aria-hidden />
        <h1>Identifying your plant…</h1>
        <p className="muted">Comparing your photo against Pl@ntNet&apos;s database.</p>
      </div>
    </main>
  );
}
