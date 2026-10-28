// Confidence bands (percent). With thousands of species a model rarely reaches
// 100%, so 70%+ is treated as an identification and 40-70% as a possible match.
export const HIGH_CONFIDENCE = 70;
export const MEDIUM_CONFIDENCE = 40;
// Below MEDIUM_CONFIDENCE, a genus is reported when its species' combined
// confidence reaches this (94-100% correct on the validation split for our model).
export const GENUS_CONFIDENCE = 50;

export function confidenceLevel(percent) {
  if (percent >= HIGH_CONFIDENCE) return 'high';
  if (percent >= MEDIUM_CONFIDENCE) return 'medium';
  return 'low';
}

export default function ConfidenceBar({ confidence, compact = false }) {
  const percent = Math.max(0, Math.min(100, confidence ?? 0));
  const level = confidenceLevel(percent);

  return (
    <div className="confidence" aria-label={`Match confidence ${percent.toFixed(0)} percent`}>
      {!compact && (
        <div className="confidence__label">
          <span>Confidence</span>
          <strong className={`text-${level}`}>{percent.toFixed(0)}%</strong>
        </div>
      )}
      <div className={`confidence__track ${compact ? 'confidence__track--compact' : ''}`}>
        <div className={`confidence__fill bg-${level}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
