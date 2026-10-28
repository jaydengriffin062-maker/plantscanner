'use client';

import { Camera, Leaf, Trash2 } from 'lucide-react';
import Link from 'next/link';

import AppHeader from '@/components/AppHeader';
import EmptyState from '@/components/EmptyState';
import HistoryItem from '@/components/HistoryItem';
import { displayName } from '@/lib/plantNames';
import { clearHistory, removeFromHistory, useHistory } from '@/lib/scanStorage';

export default function HistoryPage() {
  const history = useHistory();

  const confirmClearAll = () => {
    if (window.confirm('Clear history? This removes all saved scans.')) clearHistory();
  };

  const confirmDelete = (record) => {
    if (window.confirm(`Remove ${displayName(record.matches[0])} from your history?`)) {
      removeFromHistory(record.id);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="container history">
        <div className="page-title">
          <div>
            <h1 className="display display--sm">Scan history</h1>
            <p className="muted">Saved on this device, so you can open them again even offline.</p>
          </div>
          {history?.length > 0 && (
            <button type="button" className="button button--ghost button--danger" onClick={confirmClearAll}>
              <Trash2 size={18} aria-hidden />
              Clear all
            </button>
          )}
        </div>

        {history !== null && history.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Leaf}
              title="No scans yet"
              message="Plants you identify are saved here so you can look them up again, even offline."
            >
              <Link href="/" className="button button--primary">
                <Camera size={20} aria-hidden />
                Scan a plant
              </Link>
            </EmptyState>
          </div>
        ) : (
          <div className="history-grid">
            {(history ?? []).map((record) => (
              <HistoryItem key={record.id} record={record} onDelete={() => confirmDelete(record)} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
