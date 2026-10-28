'use client';

import { Camera, CircleAlert, CircleHelp, ExternalLink, Leaf } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import AboutPlantCard from '@/components/AboutPlantCard';
import AlternativeMatches from '@/components/AlternativeMatches';
import AppHeader from '@/components/AppHeader';
import CareTipsCard from '@/components/CareTipsCard';
import { confidenceLevel } from '@/components/ConfidenceBar';
import ConfidenceRing from '@/components/ConfidenceRing';
import EmptyState from '@/components/EmptyState';
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

/** Heading that separates what the scan found from information looked up afterwards. */
function SectionLabel({ title, source }) {
  return (
    <div className="section-label">
      <h2>{title}</h2>
      <span>{source}</span>
    </div>
  );
}

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
    <section className="card result-hero enter">
      <div className="result-hero__top">
        <div className="result-hero__names">
          <span className="status status--medium">
            <CircleHelp size={15} aria-hidden />
            {looksHybrid ? 'Likely hybrid or garden variety' : 'Likely genus'}
          </span>
          <h1 className="result-hero__name result-hero__name--sm">
            {looksHybrid ? 'Probably a hybrid or garden variety of ' : 'Probably a member of the genus '}
            <em>{genus.name}</em>
          </h1>
        </div>
        <ConfidenceRing confidence={genus.confidence} label="genus" />
      </div>
      <p className="note">
        {looksHybrid ? (
          <>
            It matches {sameGenus > 1 ? `${sameGenus} ` : ''}
            <em>{genus.name}</em> species at once, including a known hybrid. Plants like this are usually bred from
            more than one species, as most garden varieties are, so they don&apos;t match any single wild species.
          </>
        ) : (
          <>
            We can&apos;t tell which species it is. Close relatives in this genus can look very alike, and it may
            also be a hybrid or garden variety.
          </>
        )}
      </p>
      {taxonomy.length > 0 && (
        <dl className="facts">
          {taxonomy.map(([label, value]) => (
            <div key={label} className="fact">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function NotSureCard() {
  return (
    <section className="card result-hero enter">
      <span className="status status--low">
        <CircleAlert size={15} aria-hidden />
        Low confidence
      </span>
      <h1 className="result-hero__name result-hero__name--sm">We couldn&apos;t confidently identify this plant</h1>
      <p className="note">
        <strong>Low confidence — this may be a similar species.</strong> The closest matches from the scan are listed
        below. For a better result, photograph a single leaf, flower or fruit up close, in good light.
      </p>
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
      <>
        <AppHeader backHref="/" />
        <main className="container page-center">
          <EmptyState icon={Leaf} title="Scan not found" message="This scan may have been deleted from your history.">
            <Link href="/" className="button button--primary">
              <Camera size={20} aria-hidden />
              Scan a plant
            </Link>
          </EmptyState>
        </main>
      </>
    );
  }

  const bestWithName = { ...best, commonName: best.commonName ?? lookedUpName };
  const learnMoreUrl =
    info.data?.description?.url ??
    info.data?.links?.inaturalist ??
    (best.gbifId ? `https://www.gbif.org/species/${best.gbifId}` : null);
  const provenance = (
    <p className="provenance">
      Scanned {new Date(record.createdAt).toLocaleString()} · Identification by{' '}
      {PROVIDER_LABELS[record.provider ?? 'plantnet'] ?? record.provider}
    </p>
  );
  const actions = (
    <div className="result-actions">
      <Link href="/" className="button button--primary button--lg">
        <Camera size={20} aria-hidden />
        Scan another plant
      </Link>
      {level !== 'low' && learnMoreUrl && (
        <a href={learnMoreUrl} target="_blank" rel="noreferrer" className="button button--secondary">
          <ExternalLink size={18} aria-hidden />
          Learn more
        </a>
      )}
    </div>
  );

  return (
    <>
      <AppHeader backHref="/" />
      <main className="container results">
        <aside className="results__media">
          <figure className="photo-card enter">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL of the user's photo */}
            <img src={record.imageDataUrl} alt={`Your photo of ${displayName(bestWithName)}`} />
            <figcaption>Your photo</figcaption>
          </figure>
          <div className="results__media-actions">
            {actions}
            {provenance}
          </div>
        </aside>

        <div className="results__content">
          {level === 'low' ? (
            <>
              <SectionLabel title="Identification" source="From your scan" />
              {record.genus ? <GenusCard genus={record.genus} matches={record.matches} /> : <NotSureCard />}
              <AlternativeMatches
                matches={record.matches.slice(0, POSSIBLE_MATCH_COUNT)}
                title="Possible matches"
                numbered
                style={{ '--i': 1 }}
              />
            </>
          ) : (
            <>
              <SectionLabel title="Identification" source="From your scan" />
              <ResultCard match={bestWithName} level={level} />
              {level === 'medium' ? (
                <AlternativeMatches
                  matches={record.matches.slice(0, POSSIBLE_MATCH_COUNT)}
                  title="Possible matches"
                  numbered
                  style={{ '--i': 1 }}
                />
              ) : (
                <AlternativeMatches matches={record.matches.slice(1)} style={{ '--i': 1 }} />
              )}

              <SectionLabel title="About this plant" source="From Wikipedia & iNaturalist" />
              <AboutPlantCard info={info} style={{ '--i': 2 }} />
              <ReferencePhotos
                userPhoto={record.imageDataUrl}
                info={info}
                speciesName={best.scientificName}
                style={{ '--i': 3 }}
              />
              <CareTipsCard match={best} style={{ '--i': 4 }} />
            </>
          )}

          <div className="results__footer-actions">
            {actions}
            {provenance}
          </div>
        </div>
      </main>
    </>
  );
}
