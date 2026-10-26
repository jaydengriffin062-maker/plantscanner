'use client';

import { Camera, ImageUp, LoaderCircle, SwitchCamera, X, Zap, ZapOff } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import EmptyState from '@/components/EmptyState';
import FileButton from '@/components/FileButton';
import { useStartScan } from '@/lib/useStartScan';

export default function CameraPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { startFromSource, startFromFile, isPreparing, error: fileError } = useStartScan();

  const [facingMode, setFacingMode] = useState('environment');
  const [status, setStatus] = useState('starting'); // starting | live | error
  const [cameraError, setCameraError] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [canSwitch, setCanSwitch] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  // Start (or restart) the live camera whenever the facing mode changes,
  // and always stop it when leaving the page.
  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setCameraError(
          window.isSecureContext
            ? "This browser can't show a live camera. Use your phone's camera app instead."
            : 'The live camera needs a secure (https) connection.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play().catch(() => {});

        const [track] = stream.getVideoTracks();
        const capabilities = track.getCapabilities?.() ?? {};
        setTorchSupported(Boolean(capabilities.torch));
        setTorchOn(false);

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setCanSwitch(devices.filter((device) => device.kind === 'videoinput').length > 1);
        setStatus('live');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setCameraError(describeCameraError(err));
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  const toggleTorch = async () => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((on) => !on);
    } catch {
      setTorchSupported(false);
    }
  };

  const switchCamera = () => {
    setStatus('starting');
    setFacingMode((mode) => (mode === 'environment' ? 'user' : 'environment'));
  };

  const takePicture = useCallback(() => {
    const video = videoRef.current;
    if (!video || status !== 'live' || isCapturing || !video.videoWidth) return;
    setIsCapturing(true);
    setFlashKey((key) => key + 1);
    try {
      startFromSource(video, { replace: true });
    } catch {
      setIsCapturing(false);
      setCameraError('Could not take the photo. Please try again.');
    }
  }, [status, isCapturing, startFromSource]);

  const handleFile = (file) => startFromFile(file, { replace: true });

  return (
    <main className="camera">
      <video
        ref={videoRef}
        className={`camera__video ${facingMode === 'user' ? 'camera__video--mirrored' : ''}`}
        playsInline
        muted
        autoPlay
      />
      {flashKey > 0 && <div key={flashKey} className="camera__flash" />}

      {status === 'error' ? (
        <div className="camera__fallback">
          <EmptyState icon={Camera} title="Live camera unavailable" message={cameraError}>
            <FileButton
              icon={Camera}
              label="Open phone camera"
              capture="environment"
              onFile={handleFile}
              disabled={isPreparing}
            />
            <FileButton
              icon={ImageUp}
              label="Choose from gallery"
              variant="secondary"
              onFile={handleFile}
              disabled={isPreparing}
            />
            <Link href="/" className="button button--ghost">
              Go back
            </Link>
          </EmptyState>
          {fileError && <p className="error-text">{fileError}</p>}
        </div>
      ) : (
        <>
          <div className="camera__top">
            <Link href="/" className="round-button" aria-label="Close camera">
              <X size={24} />
            </Link>
            {torchSupported && (
              <button type="button" className="pill-button" onClick={toggleTorch} aria-pressed={torchOn}>
                {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
                {torchOn ? 'FLASH ON' : 'FLASH OFF'}
              </button>
            )}
          </div>

          <div className="camera__guide" aria-hidden>
            <div className="camera__frame">
              <span className="corner corner--tl" />
              <span className="corner corner--tr" />
              <span className="corner corner--bl" />
              <span className="corner corner--br" />
            </div>
            <p className="camera__hint">
              {status === 'starting' ? 'Starting camera…' : 'Centre a leaf or flower in the frame'}
            </p>
          </div>

          {(fileError || cameraError) && <p className="camera__error">{fileError || cameraError}</p>}

          <div className="camera__bottom">
            <FileButtonRound onFile={handleFile} disabled={isPreparing} />

            <button
              type="button"
              className="shutter"
              onClick={takePicture}
              disabled={status !== 'live' || isCapturing}
              aria-label="Take picture"
            >
              <span className="shutter__inner">
                {(isCapturing || status === 'starting') && <LoaderCircle className="spin" size={28} />}
              </span>
            </button>

            {canSwitch ? (
              <button type="button" className="round-button" onClick={switchCamera} aria-label="Switch camera">
                <SwitchCamera size={24} />
              </button>
            ) : (
              <span className="round-button round-button--placeholder" />
            )}
          </div>
        </>
      )}
    </main>
  );
}

/** Round gallery button for the camera's bottom bar. */
function FileButtonRound({ onFile, disabled }) {
  const inputRef = useRef(null);
  return (
    <>
      <button
        type="button"
        className="round-button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label="Choose from gallery"
      >
        <ImageUp size={24} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          onFile(file);
        }}
      />
    </>
  );
}

function describeCameraError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. Allow camera access in your browser settings, or use your phone camera app below.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
      return 'The camera is being used by another app. Close it and try again.';
    default:
      return 'The camera could not be started.';
  }
}
