import { AlertTriangle, Heart } from 'lucide-react';
import Button, { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import { SkeletonGrid } from '../components/common/SkeletonCard';
import ListingCard from '../components/listings/ListingCard';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatCount } from '../lib/format';
import { useSaved } from '../lib/SavedContext';
import type { Listing } from '../types';
import styles from './Saved.module.css';

export default function Saved() {
  useDocumentTitle('Saved items');
  const { isSaved } = useSaved();
  const { data, error, loading, retry } = useApi<{ items: Listing[] }>('/favorites');

  // Un-hearting an item removes it from this list straight away (the server is updated by the heart itself).
  const items = (data?.items ?? []).filter((l) => isSaved(l.id));

  return (
    <div className={`${styles.page} container`}>
      <header className={styles.header}>
        <h1>Saved items</h1>
        {data && <p>{items.length === 0 ? 'Nothing saved right now.' : `${formatCount(items.length, 'item')} you’ve saved for later.`}</p>}
      </header>

      {error ? (
        <EmptyState
          icon={<AlertTriangle size={30} aria-hidden />}
          title="We couldn’t load your saved items"
          description="Check that the API is running, then try again."
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : loading && !data ? (
        <SkeletonGrid count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={30} aria-hidden />}
          title="Nothing saved yet"
          description="Tap the heart on any listing to keep it here so you can find it again quickly."
          action={<ButtonLink to="/browse">Browse rentals</ButtonLink>}
        />
      ) : (
        <div className={styles.grid}>
          {items.map((l, i) => (
            <Reveal key={l.id} delay={Math.min(i, 7) * 60}>
              <ListingCard listing={l} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
