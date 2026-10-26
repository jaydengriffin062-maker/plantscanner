import { Droplets, Info, Sprout, Sun } from 'lucide-react';

import { getCareTips } from '@/lib/careTips';

const ICONS = { light: Sun, water: Droplets, soil: Sprout, extra: Info };

export default function CareTipsCard({ match }) {
  const { tips, basis } = getCareTips(match);

  return (
    <section className="card">
      <h2 className="card__title">Care tips</h2>
      <p className="muted small care__subtitle">
        {basis
          ? `General guidance for plants in ${basis}.`
          : 'General houseplant guidance. Check species-specific advice for best results.'}
      </p>

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
    </section>
  );
}
