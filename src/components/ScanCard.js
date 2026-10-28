import { Trash2 } from 'lucide-react';
import Link from 'next/link';

import { displayName, hasCommonName } from '@/lib/plantNames';

import { confidenceLevel } from './ConfidenceBar';

/** A saved scan, used by Recent scans and History. Opens the stored result. */
export default function ScanCard({ record, onDelete }) {
  const best = record.matches[0];
  const name = displayName(best);
  const date = new Date(record.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="scan-card">
      <Link href={`/plant?id=${encodeURIComponent(record.id)}`} className="scan-card__link">
        <div className="scan-card__media">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail */}
          <img src={record.imageDataUrl} alt={`Photo of ${name}`} loading="lazy" decoding="async" />
        </div>
        <div className="scan-card__body">
          <h3 className={`scan-card__name ${hasCommonName(best) ? '' : 'italic'}`}>{name}</h3>
          {hasCommonName(best) && <p className="scan-card__scientific">{best.scientificName}</p>}
          <div className="scan-card__meta">
            <span className={`chip chip--${confidenceLevel(best.confidence)}`}>
              {best.confidence.toFixed(0)}% confidence
            </span>
            <time dateTime={record.createdAt}>{date}</time>
          </div>
        </div>
      </Link>
      {onDelete && (
        <button type="button" className="scan-card__delete" onClick={onDelete} aria-label={`Delete ${name} from history`}>
          <Trash2 size={18} aria-hidden />
        </button>
      )}
    </article>
  );
}
