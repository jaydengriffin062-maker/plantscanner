import { Droplets, HeartHandshake, Info, Sprout, Sun } from 'lucide-react';

import { getCareTips } from '@/lib/careTips';

const ICONS = { light: Sun, water: Droplets, soil: Sprout, extra: Info };

export default function CareTipsCard({ match, style }) {
  const { tips, basis } = getCareTips(match);

  return (
    <section className="card enter" style={style}>
      <h2 className="card__title">
        <span className="card__title-icon">
          <HeartHandshake size={18} aria-hidden />
        </span>
        Care tips
      </h2>
      <p className="muted small care__subtitle">
        {basis
          ? `General guidance for plants in ${basis}.`
          : 'General houseplant guidance. Check species-specific advice for best results.'}
      </p>

      <div className="tips">
      {tips.map((tip) => {
        const Icon = ICONS[tip.key];
        return (
          <div key={tip.key} className="tip">
            <div className="tip__icon">
              <Icon size={20} aria-hidden />
            </div>
            <div>
              <h3 className="tip__title">{tip.title}</h3>
              <p className="tip__text">{tip.text}</p>
            </div>
          </div>
        );
      })}
      </div>
    </section>
  );
}
