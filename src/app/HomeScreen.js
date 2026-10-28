'use client';

import { BookOpen, Camera, Clock, ScanSearch, Sparkles } from 'lucide-react';
import Link from 'next/link';

import AppHeader from '@/components/AppHeader';
import ScanCard from '@/components/ScanCard';
import ScanDropzone from '@/components/ScanDropzone';
import { useHistory } from '@/lib/scanStorage';

const RECENT_COUNT = 4;

export default function HomeScreen({ speciesCount }) {
  const history = useHistory();
  const recent = history?.slice(0, RECENT_COUNT) ?? [];

  const steps = [
    { icon: Camera, title: 'Snap or upload', text: 'A clear, close photo of a leaf, flower or fruit works best.' },
    {
      icon: ScanSearch,
      title: 'Identify',
      text: speciesCount
        ? `Our model compares your photo with ${speciesCount.toLocaleString('en-US')} supported plant species and shows how confident it is.`
        : 'Our model compares your photo with supported plant species and shows how confident it is.',
    },
    { icon: BookOpen, title: 'Learn', text: 'See its name, family, a description and reference photos.' },
  ];

  return (
    <>
      <AppHeader />
      <main className="container home">
        <section className="home__hero">
          <div className="home__intro enter">
            <span className="pill">
              <Sparkles size={14} aria-hidden />
              Plant identification from a single photo
            </span>
            <h1 className="display">
              What plant is <span className="display__accent">that?</span>
            </h1>
            <p className="lead">
              Take or upload a photo and we&apos;ll name the plant, show how confident we are, and tell you more
              about it.
            </p>
          </div>

          <ScanDropzone className="home__scan enter" />

          <ol className="steps">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="step enter" style={{ '--i': index + 1 }}>
                <span className="step__icon">
                  <Icon size={20} aria-hidden />
                </span>
                <div>
                  <h3 className="step__title">{title}</h3>
                  <p className="step__text">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="home__recent" aria-labelledby="recent-title">
          <div className="section-header">
            <h2 id="recent-title">Recent scans</h2>
            {recent.length > 0 && <Link href="/history">See all</Link>}
          </div>

          {history !== null && recent.length === 0 ? (
            <div className="empty-recent">
              <Clock size={20} aria-hidden />
              <span>Plants you identify will appear here, and stay available offline.</span>
            </div>
          ) : (
            <ul className="recent-row" aria-label="Recent scans">
              {recent.map((record) => (
                <li key={record.id}>
                  <ScanCard record={record} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
