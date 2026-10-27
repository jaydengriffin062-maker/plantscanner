import { ExternalLink } from 'lucide-react';

/** "About this plant": description from the plant information service, with its source. */
export default function AboutPlantCard({ info }) {
  const { status, data } = info;

  return (
    <section className="card" aria-busy={status === 'loading'}>
      <h2 className="card__title">About this plant</h2>

      {status === 'loading' && (
        <div className="skeleton-lines" aria-label="Loading plant information">
          <span />
          <span />
          <span />
        </div>
      )}

      {status === 'error' && (
        <p className="muted small">Plant information is unavailable right now. Please try again later.</p>
      )}

      {status === 'ready' &&
        (data.description ? (
          <>
            <p className="about__text">{data.description.text}</p>
            {data.description.url && (
              <a href={data.description.url} target="_blank" rel="noreferrer" className="source-link">
                Source: {data.description.source}
                <ExternalLink size={14} aria-hidden />
              </a>
            )}
          </>
        ) : (
          <p className="muted small">We couldn&apos;t find a reliable description for this species yet.</p>
        ))}
    </section>
  );
}
