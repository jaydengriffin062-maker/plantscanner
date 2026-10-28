'use client';

import { Camera, CircleAlert, Flower2, ImageUp, Leaf, LoaderCircle, Sprout } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { useStartScan } from '@/lib/useStartScan';

import FileButton from './FileButton';

/** The main entry point: take a photo, upload one, or drop one here on desktop. */
export default function ScanDropzone({ className = '' }) {
  const { startFromFile, isPreparing, error } = useStartScan();
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave also fire for child elements, so count them.
  const depth = useRef(0);

  const onDragEnter = (event) => {
    if (!event.dataTransfer?.types?.includes('Files')) return;
    event.preventDefault();
    depth.current += 1;
    setDragging(true);
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };
  const onDragOver = (event) => {
    if (event.dataTransfer?.types?.includes('Files')) event.preventDefault();
  };
  const onDrop = (event) => {
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    startFromFile(event.dataTransfer.files?.[0]);
  };

  return (
    <section
      className={`dropzone ${dragging ? 'is-dragging' : ''} ${className}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-labelledby="dropzone-title"
    >
      <div className="dropzone__art" aria-hidden>
        <span className="dropzone__orbit" />
        <span className="dropzone__badge dropzone__badge--a">
          <Flower2 size={18} />
        </span>
        <span className="dropzone__badge dropzone__badge--b">
          <Sprout size={18} />
        </span>
        <span className="dropzone__core">
          <Leaf size={44} />
        </span>
      </div>

      <h2 id="dropzone-title" className="dropzone__title">
        {dragging ? 'Drop to scan this photo' : 'Scan a plant'}
      </h2>
      <p className="dropzone__hint">
        <span className="only-fine-pointer">Drag and drop a photo here, or choose an option below.</span>
        <span className="only-coarse-pointer">Photograph a leaf or flower up close, or upload a photo.</span>
      </p>

      <div className="dropzone__actions">
        <Link href="/camera" className="button button--primary">
          <Camera size={20} aria-hidden />
          Take photo
        </Link>
        <FileButton
          icon={ImageUp}
          label="Upload image"
          variant="secondary"
          onFile={(file) => startFromFile(file)}
          disabled={isPreparing}
        />
      </div>

      <p className="dropzone__meta">JPG, PNG or WebP · up to 25 MB</p>

      {error && (
        <div className="alert alert--danger" role="alert">
          <CircleAlert size={18} aria-hidden />
          <span>{error}</span>
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
