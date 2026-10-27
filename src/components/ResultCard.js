import { CircleCheck, CircleHelp } from 'lucide-react';

import { hasCommonName } from '@/lib/plantNames';

import ConfidenceBar from './ConfidenceBar';

const HEADLINES = {
  high: { text: 'Plant identified', icon: CircleCheck },
  medium: { text: 'Possible match', icon: CircleHelp },
};

const TAXONOMY = [
  ['genus', 'Genus'],
  ['family', 'Family'],
  ['order', 'Order'],
  ['taxonClass', 'Class'],
];

/** The headline card for the best match (high or medium confidence). */
export default function ResultCard({ match, level }) {
  const headline = HEADLINES[level] ?? HEADLINES.medium;
  const Icon = headline.icon;
  const named = hasCommonName(match);

  return (
    <section className="card">
      <p className={`eyebrow eyebrow--${level}`}>
        <Icon size={16} aria-hidden />
        {headline.text}
      </p>

      <dl className="names">
        {named && (
          <div>
            <dt>Common name</dt>
            <dd className="result__common">{match.commonName}</dd>
          </div>
        )}
        <div>
          <dt>Scientific name</dt>
          <dd className={named ? 'result__scientific' : 'result__common result__common--scientific'}>
            {match.scientificName}
          </dd>
        </div>
      </dl>
      {match.otherCommonNames?.length > 0 && (
        <p className="muted small">Also known as {match.otherCommonNames.join(', ')}</p>
      )}

      <div className="tags">
        {TAXONOMY.filter(([key]) => match[key]).map(([key, label]) => (
          <div key={key} className="tag">
            <span>{label}</span>
            {match[key]}
          </div>
        ))}
      </div>

      <ConfidenceBar confidence={match.confidence} />

      {level === 'medium' && (
        <p className="muted small">
          This is our best guess, but other species are possible. Compare the photos below, or try a sharper
          photo of a single leaf or flower.
        </p>
      )}
    </section>
  );
}
