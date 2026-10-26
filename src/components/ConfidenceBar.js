export function confidenceLevel(percent) {
  if (percent >= 70) return 'high';
  if (percent >= 40) return 'medium';
  return 'low';
}

export default function ConfidenceBar({ confidence, compact = false }) {
  const percent = Math.max(0, Math.min(100, confidence ?? 0));
  const level = confidenceLevel(percent);

  return (
    <div className="confidence" aria-label={`Match confidence ${percent.toFixed(0)} percent`}>
      {!compact && (
        <div className="confidence__label">
          <span>Match confidence</span>
          <strong className={`text-${level}`}>{percent.toFixed(1)}%</strong>
        </div>
      )}
      <div className={`confidence__track ${compact ? 'confidence__track--compact' : ''}`}>
        <div className={`confidence__fill bg-${level}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
