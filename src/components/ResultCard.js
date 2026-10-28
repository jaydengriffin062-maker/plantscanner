import { CircleCheck, CircleHelp } from 'lucide-react';

import { hasCommonName, plantType } from '@/lib/plantNames';

import ConfidenceRing from './ConfidenceRing';

const HEADLINES = {
  high: { text: 'Plant identified', icon: CircleCheck },
  medium: { text: 'Possible match', icon: CircleHelp },
};

/** The headline card for the best match (high or medium confidence). Everything here comes from the scan. */
export default function ResultCard({ match, level }) {
  const headline = HEADLINES[level] ?? HEADLINES.medium;
  const Icon = headline.icon;
  const named = hasCommonName(match);
  const type = plantType(match.taxonClass);
  const facts = [
    ['Plant type', type],
    ['Genus', match.genus],
    ['Family', match.family],
    ['Order', match.order],
    // The plant type already says this in plain language, so only show the class without one.
    ['Class', type ? null : match.taxonClass],
  ].filter(([, value]) => value);

  return (
    <section className="card result-hero enter">
      <div className="result-hero__top">
        <div className="result-hero__names">
          <span className={`status status--${level}`}>
            <Icon size={15} aria-hidden />
            {headline.text}
          </span>
          <h1 className={`result-hero__name ${named ? '' : 'italic'}`}>
            {named ? match.commonName : match.scientificName}
          </h1>
          {named && <p className="result-hero__scientific">{match.scientificName}</p>}
          {match.otherCommonNames?.length > 0 && (
            <p className="muted small">Also known as {match.otherCommonNames.join(', ')}</p>
          )}
        </div>
        <ConfidenceRing confidence={match.confidence} label="match" />
      </div>

      {facts.length > 0 && (
        <dl className="facts">
          {facts.map(([label, value]) => (
            <div key={label} className="fact">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {level === 'medium' && (
        <p className="note">
          This is our best guess, but other species are possible. Compare the reference photos, or try a sharper
          photo of a single leaf or flower.
        </p>
      )}
    </section>
  );
}
