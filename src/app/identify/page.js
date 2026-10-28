'use client';

import {
  Camera,
  CircleCheck,
  ImageOff,
  ImageUp,
  RotateCcw,
  ScanLine,
  SearchX,
  ServerCrash,
  Trash2,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import AppHeader from '@/components/AppHeader';
import FileButton from '@/components/FileButton';
import { dataUrlToBlob } from '@/lib/imageUtils';
import {
  addToHistory,
  clearPendingScan,
  createScanId,
  saveLastResult,
  usePendingScan,
} from '@/lib/scanStorage';
import { useStartScan } from '@/lib/useStartScan';

const TIPS = ['The plant is sharp and in focus', 'It fills most of the photo', 'The light is even, without harsh shadows'];

/** Turns a failed request into a friendly title + icon for the error card. */
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

/** Preview the chosen photo, then send it for identification when the user taps "Scan plant". */
export default function IdentifyPage() {
  const router = useRouter();
  const pending = usePendingScan();
  const { startFromFile, isPreparing, error: fileError } = useStartScan();
  const [isScanning, setIsScanning] = useState(false);
  const [failure, setFailure] = useState(null); // { status, message }
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
      doneRef.current = true;
      router.replace(`/plant?id=${encodeURIComponent(record.id)}`);
      clearPendingScan();
    } catch (err) {
      setFailure({ status: err?.status ?? 500, message: err?.message });
      scanningRef.current = false;
      setIsScanning(false);
    }
  };

  const replacePhoto = (file) => {
    setFailure(null);
    startFromFile(file, { replace: true });
  };

  const removePhoto = () => {
    clearPendingScan(); // the effect above then returns home
  };

  if (!pending) return null;

  const busy = isScanning || isPreparing;
  const fromCamera = pending.origin === 'camera';
  const problem = failure && describeFailure(failure);
  const ProblemIcon = problem?.icon;

  return (
    <>
      <AppHeader backHref="/" />
      <main className="container review">
        <div className={`photo-frame enter ${isScanning ? 'photo-frame--scanning' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
          <img src={pending.uploadDataUrl} alt="The plant photo you selected" className="photo-frame__image" />
          <span className="photo-frame__badge">{fromCamera ? 'Captured photo' : 'Your photo'}</span>
          {isScanning && (
            <div className="photo-frame__scan" aria-hidden>
              <span className="photo-frame__grid" />
              <span className="photo-frame__line" />
            </div>
          )}
        </div>

        <section className="card review__panel enter" style={{ '--i': 1 }} aria-live="polite">
          {isScanning ? (
            <div className="scan-status" role="status">
              <span className="scan-status__icon">
                <ScanLine size={26} aria-hidden />
              </span>
              <h1 className="panel-title">Analyzing your plant…</h1>
              <p className="muted">Looking at leaf shape, flowers and texture to find the closest species.</p>
              <div className="progress" aria-hidden>
                <span />
              </div>
            </div>
          ) : problem ? (
            <div className="problem">
              <span className="problem__icon">
                <ProblemIcon size={26} aria-hidden />
              </span>
              <h1 className="panel-title">{problem.title}</h1>
              {problem.message && <p className="muted">{problem.message}</p>}
            </div>
          ) : (
            <>
              <p className="eyebrow">Step 2 of 3 · Review</p>
              <h1 className="panel-title">Ready to identify</h1>
              <ul className="checklist">
                {TIPS.map((tip) => (
                  <li key={tip}>
                    <CircleCheck size={18} aria-hidden />
                    {tip}
                  </li>
                ))}
              </ul>
            </>
          )}

          {fileError && (
            <div className="alert alert--danger" role="alert">
              <ImageOff size={18} aria-hidden />
              <span>{fileError}</span>
            </div>
          )}

          {!isScanning && (
            <div className="review__actions">
              <button type="button" className="button button--primary button--lg" onClick={scan} disabled={busy}>
                {problem ? <RotateCcw size={20} aria-hidden /> : <ScanLine size={20} aria-hidden />}
                {problem ? 'Try again' : 'Scan plant'}
              </button>
              <div className="review__secondary">
                {fromCamera ? (
                  <Link href="/camera" replace className="button button--secondary">
                    <Camera size={20} aria-hidden />
                    Retake
                  </Link>
                ) : (
                  <FileButton
                    icon={ImageUp}
                    label={isPreparing ? 'Preparing…' : 'Replace'}
                    variant="secondary"
                    onFile={replacePhoto}
                    disabled={busy}
                  />
                )}
                <button type="button" className="button button--ghost" onClick={removePhoto} disabled={busy}>
                  <Trash2 size={18} aria-hidden />
                  Remove
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
