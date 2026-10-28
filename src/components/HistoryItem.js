import { Trash2 } from 'lucide-react';
import Link from 'next/link';

import { displayName, hasCommonName } from '@/lib/plantNames';

import { confidenceLevel } from './ConfidenceBar';

export default function HistoryItem({ record, onDelete }) {
  const best = record.matches[0];
  const date = new Date(record.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="history-item">
      <Link href={`/plant?id=${encodeURIComponent(record.id)}`} className="history-item__link">
        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail */}
        <img src={record.imageDataUrl} alt="" className="history-item__thumb" />
        <div className="history-item__body">
          <strong className="truncate">{displayName(best)}</strong>
          {hasCommonName(best) && <em className="truncate">{best.scientificName}</em>}
          <div className="history-item__meta">
            <span className={`chip chip--${confidenceLevel(best.confidence)}`}>
              {best.confidence.toFixed(0)}% match
            </span>
            <span>{date}</span>
          </div>
        </div>
      </Link>
      {onDelete && (
        <button
          type="button"
          className="icon-button icon-button--plain"
          onClick={onDelete}
          aria-label={`Delete ${displayName(best)} from history`}
        >
          <Trash2 size={20} />
        </button>
      )}
    </div>
  );
}
