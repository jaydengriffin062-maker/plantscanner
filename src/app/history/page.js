'use client';

import { Camera, Leaf } from 'lucide-react';
import Link from 'next/link';

import EmptyState from '@/components/EmptyState';
import HistoryItem from '@/components/HistoryItem';
import PageHeader from '@/components/PageHeader';
import { clearHistory, removeFromHistory, useHistory } from '@/lib/scanStorage';

export default function HistoryPage() {
  const history = useHistory();

  const confirmClearAll = () => {
    if (window.confirm('Clear history? This removes all saved scans.')) clearHistory();
  };

  const confirmDelete = (record) => {
    if (window.confirm(`Remove ${record.matches[0].commonName} from your history?`)) {
      removeFromHistory(record.id);
    }
  };

  return (
    <main className="page page--flush">
      <PageHeader
        title="Scan history"
        action={
          history?.length > 0 && (
            <button type="button" className="text-button text-danger" onClick={confirmClearAll}>
              Clear
            </button>
          )
        }
      />

      {history !== null && history.length === 0 ? (
        <EmptyState
          icon={Leaf}
          title="No scans yet"
          message="Plants you identify are saved here so you can look them up again, even offline."
        >
          <Link href="/camera" className="button button--primary">
            <Camera size={22} aria-hidden />
            Scan a plant
          </Link>
        </EmptyState>
      ) : (
        <div className="stack history-list">
          {(history ?? []).map((record) => (
            <HistoryItem key={record.id} record={record} onDelete={() => confirmDelete(record)} />
          ))}
        </div>
      )}
    </main>
  );
}
