import { ListOrdered } from 'lucide-react';

import { displayName, hasCommonName } from '@/lib/plantNames';

import ConfidenceBar, { confidenceLevel } from './ConfidenceBar';

/** Lists candidate matches returned by the identification service. */
export default function AlternativeMatches({ matches, title = 'Other possible matches', numbered = false, style }) {
  if (!matches?.length) return null;

  return (
    <section className="card enter" style={style}>
      <h2 className="card__title">
        <span className="card__title-icon">
          <ListOrdered size={18} aria-hidden />
        </span>
        {title}
      </h2>
      {matches.map((match, index) => (
        <div key={match.scientificName} className="alt">
          <div className="alt__row">
            {numbered && <span className="alt__rank">{index + 1}</span>}
            <div className="alt__names">
              <strong className={hasCommonName(match) ? undefined : 'italic'}>{displayName(match)}</strong>
              {hasCommonName(match) && <em>{match.scientificName}</em>}
              {match.family && <span className="muted tiny">{match.family}</span>}
            </div>
            <span className={`alt__percent text-${confidenceLevel(match.confidence)}`}>
              {match.confidence.toFixed(0)}%
            </span>
          </div>
          <ConfidenceBar confidence={match.confidence} compact />
        </div>
      ))}
    </section>
  );
}
