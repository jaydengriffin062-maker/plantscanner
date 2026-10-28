'use client';

import { Camera, Leaf, Search, SearchX, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import AppHeader from '@/components/AppHeader';
import { confidenceLevel } from '@/components/ConfidenceBar';
import EmptyState from '@/components/EmptyState';
import ScanCard from '@/components/ScanCard';
import { displayName } from '@/lib/plantNames';
import { clearHistory, removeFromHistory, useHistory } from '@/lib/scanStorage';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High confidence' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const SORTS = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  confidence: (a, b) => b.matches[0].confidence - a.matches[0].confidence,
};

export default function HistoryPage() {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (history ?? [])
      .filter((record) => {
        const best = record.matches[0];
        if (filter !== 'all' && confidenceLevel(best.confidence) !== filter) return false;
        if (!needle) return true;
        return [best.commonName, best.scientificName, best.family, best.genus]
          .filter(Boolean)
          .some((text) => text.toLowerCase().includes(needle));
      })
      .sort(SORTS[sort]);
  }, [history, query, filter, sort]);

  const confirmClearAll = () => {
    if (window.confirm('Clear history? This removes all saved scans.')) clearHistory();
  };

  const confirmDelete = (record) => {
    if (window.confirm(`Remove ${displayName(record.matches[0])} from your history?`)) {
      removeFromHistory(record.id);
    }
  };

  const isEmpty = history !== null && history.length === 0;

  return (
    <>
      <AppHeader />
      <main className="container history">
        <div className="page-title">
          <div>
            <h1 className="display display--sm">Your plants</h1>
            <p className="muted">
              {history?.length
                ? `${history.length} saved ${history.length === 1 ? 'scan' : 'scans'}, available even offline.`
                : 'Scans are saved on this device, so you can open them again even offline.'}
            </p>
          </div>
          {history?.length > 0 && (
            <button type="button" className="button button--ghost button--danger" onClick={confirmClearAll}>
              <Trash2 size={18} aria-hidden />
              Clear all
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="card">
            <EmptyState
              icon={Leaf}
              title="No plants scanned yet"
              message="Plants you identify are saved here so you can look them up again, even offline."
            >
              <Link href="/" className="button button--primary">
                <Camera size={20} aria-hidden />
                Scan your first plant
              </Link>
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="toolbar" role="search">
              <label className="search">
                <Search size={18} aria-hidden />
                <span className="visually-hidden">Search scans</span>
                <input
                  type="search"
                  placeholder="Search scans"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="toolbar__row">
                <div className="segmented" role="group" aria-label="Filter by confidence">
                  {FILTERS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      className={`segmented__item ${filter === id ? 'is-active' : ''}`}
                      aria-pressed={filter === id}
                      onClick={() => setFilter(id)}
                    >
                      {id !== 'all' && <span className={`dot dot--${id}`} aria-hidden />}
                      {label}
                    </button>
                  ))}
                </div>
                <label className="select">
                  <span>Sort</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="confidence">Highest confidence</option>
                  </select>
                </label>
              </div>
            </div>

            {history !== null && visible.length === 0 ? (
              <div className="card">
                <EmptyState icon={SearchX} title="No matching scans" message="Try a different search or filter.">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      setQuery('');
                      setFilter('all');
                    }}
                  >
                    Show all scans
                  </button>
                </EmptyState>
              </div>
            ) : (
              <ul className="history-grid" aria-label="Saved scans">
                {visible.map((record) => (
                  <li key={record.id}>
                    <ScanCard record={record} onDelete={() => confirmDelete(record)} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}
