import { Images } from 'lucide-react';

/** "More photos": the user's photo next to licensed reference photos of the species. */
export default function ReferencePhotos({ userPhoto, info, speciesName, style }) {
  const { status, data } = info;
  const photos = data?.photos ?? [];

  if (status === 'error' || (status === 'ready' && photos.length === 0)) return null;

  return (
    <section className="card enter" style={style}>
      <h2 className="card__title">
        <span className="card__title-icon">
          <Images size={18} aria-hidden />
        </span>
        More photos
      </h2>
      <p className="muted small">Compare your photo with known examples of {speciesName}.</p>

      <div className="photo-grid">
        <figure className="photo-grid__item photo-grid__item--yours">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
          <img src={userPhoto} alt="Your photo" />
          <figcaption>Your photo</figcaption>
        </figure>

        {status === 'loading'
          ? [0, 1, 2].map((key) => <div key={key} className="photo-grid__item photo-grid__item--loading" />)
          : photos.map((photo) => (
              <figure key={photo.url} className="photo-grid__item">
                <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote iNaturalist photo, sizes vary */}
                  <img src={photo.url} alt={`Reference photo of ${speciesName}`} loading="lazy" />
                </a>
                <figcaption title={photo.attribution}>{photo.attribution}</figcaption>
              </figure>
            ))}
      </div>
      {status === 'ready' && <p className="muted tiny">Reference photos from iNaturalist, used under their Creative Commons licences.</p>}
    </section>
  );
}
