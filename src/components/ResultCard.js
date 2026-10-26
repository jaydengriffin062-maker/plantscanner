import ConfidenceBar from './ConfidenceBar';

/** The headline card for the best match. */
export default function ResultCard({ match }) {
  const hasDistinctCommonName = match.commonName !== match.scientificName;

  return (
    <section className="card">
      <p className="eyebrow">Best match</p>
      <h2 className="result__common">{match.commonName}</h2>
      {hasDistinctCommonName && <p className="result__scientific">{match.scientificName}</p>}
      {match.otherCommonNames?.length > 0 && (
        <p className="muted small">Also known as {match.otherCommonNames.join(', ')}</p>
      )}

      <div className="tags">
        {match.family && (
          <div className="tag">
            <span>Family</span>
            {match.family}
          </div>
        )}
        {match.genus && (
          <div className="tag">
            <span>Genus</span>
            {match.genus}
          </div>
        )}
      </div>

      <ConfidenceBar confidence={match.confidence} />

      {match.confidence < 40 && (
        <p className="muted small">
          Low confidence. Try a sharper photo of a single leaf or flower against a plain background.
        </p>
      )}
    </section>
  );
}
