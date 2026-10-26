'use client';

import { Camera, ExternalLink, Leaf } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import AlternativeMatches from '@/components/AlternativeMatches';
import CareTipsCard from '@/components/CareTipsCard';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import ResultCard from '@/components/ResultCard';
import { findScan, useHistory } from '@/lib/scanStorage';

export default function PlantDetails() {
  const id = useSearchParams().get('id');
  // Subscribing to history re-renders this page once storage is readable on the client.
  const history = useHistory();
  const record = history === null || !id ? null : findScan(id);

  if (history === null) return null;

  if (!record) {
    return (
      <main className="page page--center">
        <EmptyState
          icon={Leaf}
          title="Scan not found"
          message="This scan may have been deleted from your history."
        >
          <Link href="/" className="button button--primary">
            Go home
          </Link>
        </EmptyState>
      </main>
    );
  }

  const [best, ...alternatives] = record.matches;

  return (
    <main className="results">
      <PageHeader title="Results" backHref="/" />
      {/* eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail */}
      <img src={record.imageDataUrl} alt={best.commonName} className="results__photo" />

      <div className="results__cards">
        <ResultCard match={best} />
        <CareTipsCard match={best} />
        <AlternativeMatches matches={alternatives} />

        {best.gbifId && (
          <a
            href={`https://www.gbif.org/species/${best.gbifId}`}
            target="_blank"
            rel="noreferrer"
            className="link-row"
          >
            <ExternalLink size={18} aria-hidden />
            Learn more about <em>{best.scientificName}</em> on GBIF
          </a>
        )}

        <p className="muted tiny center">
          Scanned {new Date(record.createdAt).toLocaleString()} · Identification by Pl@ntNet
        </p>

        <Link href="/camera" className="button button--primary">
          <Camera size={22} aria-hidden />
          Scan another plant
        </Link>
      </div>
    </main>
  );
}
