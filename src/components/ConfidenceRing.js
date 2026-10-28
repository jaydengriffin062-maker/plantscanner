import { confidenceLevel } from './ConfidenceBar';

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular confidence indicator for the headline result. */
export default function ConfidenceRing({ confidence, label = 'confidence' }) {
  const percent = Math.max(0, Math.min(100, confidence ?? 0));
  const level = confidenceLevel(percent);

  return (
    <div className={`ring ring--${level}`} role="img" aria-label={`${percent.toFixed(0)} percent ${label}`}>
      <svg viewBox="0 0 80 80" aria-hidden>
        <circle className="ring__track" cx="40" cy="40" r={RADIUS} />
        <circle
          className="ring__value"
          cx="40"
          cy="40"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
        />
      </svg>
      <div className="ring__text">
        <strong>{percent.toFixed(0)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
