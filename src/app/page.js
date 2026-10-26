'use client';

import { Camera, Clock, ImageUp, Leaf } from 'lucide-react';
import Link from 'next/link';

import FileButton from '@/components/FileButton';
import HistoryItem from '@/components/HistoryItem';
import { useHistory } from '@/lib/scanStorage';
import { useStartScan } from '@/lib/useStartScan';

const RECENT_COUNT = 3;

export default function HomePage() {
  const history = useHistory();
  const recent = history?.slice(0, RECENT_COUNT) ?? [];
  const { startFromFile, isPreparing, error } = useStartScan();

  return (
    <main className="page">
      <section className="hero">
        <div className="hero__icon">
          <Leaf size={40} aria-hidden />
        </div>
        <h1 className="hero__title">Plant Scanner</h1>
        <p className="hero__subtitle">
          Snap or upload a photo of any plant to find out what it is and how to care for it.
        </p>
      </section>

      <div className="stack">
        <Link href="/camera" className="button button--primary">
          <Camera size={22} aria-hidden />
          Take a photo
        </Link>
        <FileButton
          icon={ImageUp}
          label={isPreparing ? 'Preparing photo…' : 'Upload from gallery'}
          variant="secondary"
          onFile={(file) => startFromFile(file)}
          disabled={isPreparing}
        />
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="section-header">
        <h2>Recent scans</h2>
        {recent.length > 0 && <Link href="/history">See all</Link>}
      </div>

      {history !== null && recent.length === 0 ? (
        <div className="empty-recent">
          <Clock size={22} aria-hidden />
          <span>Your identified plants will appear here.</span>
        </div>
      ) : (
        <div className="stack">
          {recent.map((record) => (
            <HistoryItem key={record.id} record={record} />
          ))}
        </div>
      )}
    </main>
  );
}
