'use client';

import { CircleAlert, ImageUp, ScanLine, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import FileButton from '@/components/FileButton';
import PageHeader from '@/components/PageHeader';
import { dataUrlToBlob } from '@/lib/imageUtils';
import {
  addToHistory,
  clearPendingScan,
  createScanId,
  saveLastResult,
  usePendingScan,
} from '@/lib/scanStorage';
import { useStartScan } from '@/lib/useStartScan';

/** Preview the chosen photo, then send it for identification when the user taps "Scan plant". */
export default function IdentifyPage() {
  const router = useRouter();
  const pending = usePendingScan();
  const { startFromFile, isPreparing, error: fileError } = useStartScan();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  // A ref (not state) so a double tap can't start two requests before re-render.
  const scanningRef = useRef(false);
  // Set once the result page is opening, so clearing the pending scan doesn't redirect home.
  const doneRef = useRef(false);

  useEffect(() => {
    if (pending === null && !doneRef.current) router.replace('/'); // nothing to identify
  }, [pending, router]);

  const scan = async () => {
    if (!pending || scanningRef.current) return;
    scanningRef.current = true;
    setIsScanning(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', await dataUrlToBlob(pending.uploadDataUrl), 'plant.jpg');

      const response = await fetch('/api/identify', { method: 'POST', body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || `Identification failed (${response.status}).`);
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
      doneRef.current = true;
      router.replace(`/plant?id=${encodeURIComponent(record.id)}`);
      clearPendingScan();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Could not reach the server. Check your internet connection and try again.'
          : err.message
      );
      scanningRef.current = false;
      setIsScanning(false);
    }
  };

  const replacePhoto = (file) => {
    setError(null);
    startFromFile(file, { replace: true });
  };

  const removePhoto = () => {
    clearPendingScan(); // the effect above then returns home
  };

  if (!pending) return null;

  const busy = isScanning || isPreparing;

  return (
    <main className="page page--flush preview">
      <PageHeader title={isScanning ? 'Identifying…' : 'Your photo'} backHref="/" />

      <div className={`preview__frame ${isScanning ? 'preview__frame--scanning' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
        <img src={pending.uploadDataUrl} alt="The plant photo you selected" className="preview__image" />
        {isScanning && (
          <div className="preview__overlay" aria-hidden>
            <span className="preview__scanline" />
          </div>
        )}
      </div>

      <div className="preview__body">
        {isScanning ? (
          <div className="scan-status" role="status" aria-live="polite">
            <span className="scan-status__dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <div>
              <h1>Analyzing your plant…</h1>
              <p className="muted small">Looking at leaves, flowers and shape to find the closest species.</p>
            </div>
          </div>
        ) : (
          <p className="muted center small">
            Make sure the plant is in focus and fills most of the photo. A single leaf or flower works best.
          </p>
        )}

        {(error || fileError) && (
          <div className="alert" role="alert">
            <CircleAlert size={20} aria-hidden />
            <span>{error || fileError}</span>
          </div>
        )}

        <button type="button" className="button button--primary" onClick={scan} disabled={busy}>
          <ScanLine size={22} aria-hidden />
          {isScanning ? 'Scanning…' : error ? 'Try again' : 'Scan plant'}
        </button>

        <div className="preview__actions">
          <FileButton
            icon={ImageUp}
            label={isPreparing ? 'Preparing…' : 'Replace photo'}
            variant="secondary"
            onFile={replacePhoto}
            disabled={busy}
          />
          <button type="button" className="button button--ghost" onClick={removePhoto} disabled={busy}>
            <Trash2 size={20} aria-hidden />
            Remove
          </button>
        </div>
      </div>
    </main>
  );
}
