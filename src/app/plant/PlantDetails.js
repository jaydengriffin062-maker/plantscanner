'use client';

import { Camera, CircleAlert, CircleHelp, ExternalLink, Leaf } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import AboutPlantCard from '@/components/AboutPlantCard';
import AlternativeMatches from '@/components/AlternativeMatches';
import CareTipsCard from '@/components/CareTipsCard';
import ConfidenceBar, { confidenceLevel } from '@/components/ConfidenceBar';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import ReferencePhotos from '@/components/ReferencePhotos';
import ResultCard from '@/components/ResultCard';
import { displayName } from '@/lib/plantNames';
import { findScan, updateInHistory, useHistory } from '@/lib/scanStorage';
import { usePlantInfo } from '@/lib/usePlantInfo';

const POSSIBLE_MATCH_COUNT = 3;

const PROVIDER_LABELS = {
  'botanical-vision': 'the Botanical Vision model',
  plantnet: 'Pl@ntNet',
};

/** Shown when no species is confident but most of the probability falls in one genus. */
function GenusCard({ genus, matches }) {
  const taxonomy = [
    ['Family', genus.family],
    ['Order', genus.order],
    ['Class', genus.taxonClass],
  ].filter(([, value]) => value);
  // A "×" in a candidate's name (e.g. Rosa × damascena) means hybrids are among the
  // closest matches, so a hybrid or garden variety is the likely explanation.
  const looksHybrid = matches.some((match) => match.scientificName.includes('×'));
  const sameGenus = matches.filter((match) => match.genus === genus.name).length;

  return (
    <section className="card">
      <p className="eyebrow eyebrow--medium">
        <CircleHelp size={16} aria-hidden />
        {looksHybrid ? 'Likely hybrid or garden variety' : 'Likely genus'}
      </p>
      <h2 className="result__common">
        {looksHybrid ? 'Probably a hybrid or garden variety of ' : 'Probably a member of the genus '}
        <em>{genus.name}</em>
      </h2>
      <p className="muted small">
        {looksHybrid ? (
          <>
            It matches {sameGenus > 1 ? `${sameGenus} ` : ''}
            <em>{genus.name}</em> species at once, including a known hybrid. Plants like this are usually bred from
            more than one species, as most garden varieties are, so they don&apos;t match any single wild species.
            The closest species are listed below.
          </>
        ) : (
          <>
            We can&apos;t tell which species it is. Close relatives in this genus can look very alike, and it may
            also be a hybrid or garden variety. The closest species are listed below.
          </>
        )}
      </p>
      <div className="tags">
        {taxonomy.map(([label, value]) => (
          <div key={label} className="tag">
            <span>{label}</span>
            {value}
          </div>
        ))}
      </div>
      <ConfidenceBar confidence={genus.confidence} />
    </section>
  );
}

export default function PlantDetails() {
  const id = useSearchParams().get('id');
  // Subscribing to history re-renders this page once storage is readable on the client.
  const history = useHistory();
  const record = history === null || !id ? null : findScan(id);
  const best = record?.matches[0];
  const level = best ? confidenceLevel(best.confidence) : null;
  // Only look up details for a species we're reasonably confident about.
  const info = usePlantInfo(best && level !== 'low' ? best.scientificName : null);
  const lookedUpName = info.data?.commonName ?? null;

  // The classifier only returns taxonomy, so remember the looked-up common name for history.
  useEffect(() => {
    if (record && lookedUpName && !record.matches[0].commonName) {
      updateInHistory(record.id, (item) => ({
        matches: item.matches.map((m, i) => (i === 0 ? { ...m, commonName: lookedUpName } : m)),
      }));
    }
  }, [record, lookedUpName]);

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

  const alternatives = record.matches.slice(1);
  const bestWithName = { ...best, commonName: best.commonName ?? lookedUpName };

  return (
    <main className="results">
      <PageHeader title="Results" backHref="/" />
      {/* eslint-disable-next-line @next/next/no-img-element -- local data URL of the user's photo */}
      <img src={record.imageDataUrl} alt="Your plant photo" className="results__photo" />

      <div className="results__cards">
        {level === 'low' ? (
          <>
            {record.genus ? (
              <GenusCard genus={record.genus} matches={record.matches} />
            ) : (
              <section className="card">
                <p className="eyebrow eyebrow--low">
                  <CircleAlert size={16} aria-hidden />
                  Not sure
                </p>
                <h2 className="result__common">We couldn&apos;t confidently identify this plant</h2>
                <p className="muted small">
                  The closest matches are listed below, but none is a confident match. For a better result,
                  photograph a single leaf, flower or fruit up close, in good light, against a plain background.
                </p>
              </section>
            )}
            <AlternativeMatches
              matches={record.matches.slice(0, POSSIBLE_MATCH_COUNT)}
              title="Possible matches"
              numbered
            />
          </>
        ) : (
          <>
            <ResultCard match={bestWithName} level={level} />
            <AboutPlantCard info={info} />
            <ReferencePhotos userPhoto={record.imageDataUrl} info={info} speciesName={best.scientificName} />
            {level === 'medium' ? (
              <AlternativeMatches
                matches={record.matches.slice(0, POSSIBLE_MATCH_COUNT)}
                title="Possible matches"
                numbered
              />
            ) : (
              <AlternativeMatches matches={alternatives} />
            )}
            <CareTipsCard match={best} />

            <div className="links">
              {info.data?.links?.inaturalist && (
                <a href={info.data.links.inaturalist} target="_blank" rel="noreferrer" className="link-row">
                  <ExternalLink size={18} aria-hidden />
                  {displayName(bestWithName)} on iNaturalist
                </a>
              )}
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
            </div>
          </>
        )}

        <p className="muted tiny center">
          Scanned {new Date(record.createdAt).toLocaleString()} · Identification by{' '}
          {PROVIDER_LABELS[record.provider ?? 'plantnet'] ?? record.provider}
        </p>

        <Link href="/" className="button button--primary">
          <Camera size={22} aria-hidden />
          Scan another plant
        </Link>
      </div>
    </main>
  );
}
