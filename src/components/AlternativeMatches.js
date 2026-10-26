import ConfidenceBar, { confidenceLevel } from './ConfidenceBar';

/** Lists the runner-up candidates returned by the API. */
export default function AlternativeMatches({ matches }) {
  if (!matches?.length) return null;

  return (
    <section className="card">
      <h2 className="card__title">Other possible matches</h2>
      {matches.map((match) => (
        <div key={match.scientificName} className="alt">
          <div className="alt__row">
            <div className="alt__names">
              <strong>{match.commonName}</strong>
              <em>{match.scientificName}</em>
            </div>
            <span className={`alt__percent text-${confidenceLevel(match.confidence)}`}>
              {match.confidence.toFixed(1)}%
            </span>
          </div>
          <ConfidenceBar confidence={match.confidence} compact />
        </div>
      ))}
    </section>
  );
}
