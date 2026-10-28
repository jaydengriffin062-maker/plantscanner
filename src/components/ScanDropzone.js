'use client';

import {
  Camera,
  CircleAlert,
  Flower2,
  ImageUp,
  Leaf,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  Sprout,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { clearPendingScan, usePendingScan } from '@/lib/scanStorage';
import { useIdentify } from '@/lib/useIdentify';
import { useStartScan } from '@/lib/useStartScan';

import FileButton from './FileButton';

// Visual feedback only: the API answers in one step and doesn't report stages.
const STAGES = ['Analyzing image…', 'Comparing plant features…', 'Checking possible species…', 'Preparing results…'];
const STAGE_MS = 1600;

function formatBytes(bytes) {
  if (!bytes) return null;
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The main scanner card. Empty: take a photo, upload one, or drop one here.
 * With a photo: preview it, then identify in place with a scanning animation.
 */
export default function ScanDropzone({ className = '' }) {
  const pending = usePendingScan();
  const { startFromFile, isPreparing, error: fileError } = useStartScan();
  const { identify, isScanning, problem, clearProblem } = useIdentify();
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(0);
  // dragenter/dragleave also fire for child elements, so count them.
  const depth = useRef(0);

  useEffect(() => {
    if (!isScanning) return undefined;
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), STAGE_MS);
    return () => clearInterval(timer);
  }, [isScanning]);

  const chooseFile = (file) => {
    clearProblem();
    startFromFile(file, { navigate: false });
  };
  const startIdentify = () => {
    setStage(0);
    identify(pending);
  };
  const removePhoto = () => {
    clearProblem();
    clearPendingScan();
  };

  const accepts = (event) => !isScanning && event.dataTransfer?.types?.includes('Files');
  const onDragEnter = (event) => {
    if (!accepts(event)) return;
    event.preventDefault();
    depth.current += 1;
    setDragging(true);
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDragOver = (event) => {
    if (accepts(event)) event.preventDefault();
  };
  const onDrop = (event) => {
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (!isScanning) chooseFile(event.dataTransfer.files?.[0]);
  };

  const hasPhoto = Boolean(pending);
  const fromCamera = pending?.origin === 'camera';
  const fileMeta = [pending?.fileName, formatBytes(pending?.fileSize)].filter(Boolean).join(' · ');
  const ProblemIcon = problem?.icon;

  return (
    <section
      className={`dropzone ${hasPhoto ? 'dropzone--preview' : ''} ${dragging ? 'is-dragging' : ''} ${className}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-labelledby="dropzone-title"
      aria-busy={isScanning}
    >
      {hasPhoto ? (
        <>
          <div className={`preview ${isScanning ? 'preview--scanning' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
            <img src={pending.uploadDataUrl} alt="The plant photo you selected" className="preview__image" />
            <span className="preview__badge">{fromCamera ? 'Captured photo' : 'Your photo'}</span>
            {isScanning && (
              <div className="preview__scan" aria-hidden>
                <span className="preview__line" />
              </div>
            )}
          </div>

          {isScanning ? (
            <div className="scan-status" role="status" aria-live="polite">
              <span className="scan-status__icon">
                <ScanLine size={22} aria-hidden />
              </span>
              <div>
                <h2 id="dropzone-title" className="scan-status__title">
                  Identifying your plant…
                </h2>
                <p key={stage} className="scan-status__stage">
                  {STAGES[stage]}
                </p>
              </div>
            </div>
          ) : problem ? (
            <div className="problem" role="alert">
              <span className="problem__icon">
                <ProblemIcon size={22} aria-hidden />
              </span>
              <div>
                <h2 id="dropzone-title" className="problem__title">
                  {problem.title}
                </h2>
                {problem.message && <p className="problem__message">{problem.message}</p>}
              </div>
            </div>
          ) : (
            <div className="preview__info">
              <h2 id="dropzone-title" className="dropzone__title dropzone__title--sm">
                Ready to identify
              </h2>
              <p className="dropzone__meta">{fileMeta || (fromCamera ? 'Photo from your camera' : 'Selected photo')}</p>
            </div>
          )}

          {!isScanning && (
            <div className="preview__actions">
              <button type="button" className="button button--primary button--lg" onClick={startIdentify}>
                {problem ? <RotateCcw size={20} aria-hidden /> : <ScanLine size={20} aria-hidden />}
                {problem ? 'Try again' : 'Identify plant'}
              </button>
              <div className="preview__secondary">
                {fromCamera ? (
                  <Link href="/camera" className="button button--secondary">
                    <Camera size={18} aria-hidden />
                    Retake
                  </Link>
                ) : (
                  <FileButton
                    icon={ImageUp}
                    label={isPreparing ? 'Preparing…' : 'Change image'}
                    variant="secondary"
                    onFile={chooseFile}
                    disabled={isPreparing}
                  />
                )}
                <button type="button" className="button button--ghost" onClick={removePhoto}>
                  <Trash2 size={18} aria-hidden />
                  Remove
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="dropzone__art" aria-hidden>
            <span className="dropzone__glow" />
            <span className="dropzone__orbit" />
            <span className="dropzone__badge dropzone__badge--a">
              <Flower2 size={18} />
            </span>
            <span className="dropzone__badge dropzone__badge--b">
              <Sprout size={18} />
            </span>
            <span className="dropzone__core">{dragging ? <Upload size={46} /> : <Leaf size={48} />}</span>
          </div>

          <div className="dropzone__copy">
            <h2 id="dropzone-title" className="dropzone__title" aria-live="polite">
              {dragging ? 'Drop image to scan' : 'Scan a plant'}
            </h2>
            <p className="dropzone__hint">
              <span className="only-fine-pointer">Drag and drop a photo here, or choose an option below.</span>
              <span className="only-coarse-pointer">Photograph a leaf or flower up close, or upload a photo.</span>
            </p>
          </div>

          <div className="dropzone__actions">
            <Link href="/camera" className="button button--primary button--lg">
              <Camera size={20} aria-hidden />
              Take photo
            </Link>
            <FileButton
              icon={ImageUp}
              label="Upload image"
              variant="secondary"
              className="button--lg"
              onFile={chooseFile}
              disabled={isPreparing}
            />
          </div>

          <p className="dropzone__meta">JPG, PNG or WebP · up to 25 MB</p>
        </>
      )}

      {fileError && (
        <div className="alert alert--danger" role="alert">
          <CircleAlert size={18} aria-hidden />
          <span>{fileError}</span>
        </div>
      )}

      {isPreparing && (
        <div className="dropzone__busy" role="status">
          <LoaderCircle className="spin" size={28} aria-hidden />
          Preparing your photo…
        </div>
      )}
    </section>
  );
}
