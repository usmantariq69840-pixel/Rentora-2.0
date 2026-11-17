import { Archive, ArrowUpRight, Pencil, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import { api, ApiError } from '../../lib/api';
import ListingImage from '../../components/listings/ListingImage';
import StatusBadge from '../../components/common/StatusBadge';
import { artFor } from '../../lib/art';
import { formatCount, formatPKR, formatRating } from '../../lib/format';
import type { OwnerListing } from '../../types';
import styles from './ListingRow.module.css';

interface Props { listing: OwnerListing; index?: number; onChanged?: () => void }

export default function ListingRow({ listing: l, index = 0, onChanged }: Props) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const archive = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/items/${l.id}/archive`, { method: 'POST' });
      toast.success('Listing archived');
      setConfirming(false);
      onChanged?.();
    } catch (err) {
      // For example "This listing has open booking requests" (409).
      setError(err instanceof ApiError ? err.message : 'We couldn’t archive this listing. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={styles.row} style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <Link to={`/items/${l.id}`} className={styles.thumb} tabIndex={-1} aria-hidden="true">
        <ListingImage title={l.title} imageUrl={l.imageUrl} art={artFor(l.categorySlug, l.subcategory)} />
      </Link>
      <div className={styles.main}>
        <h3><Link to={`/items/${l.id}`}>{l.title}</Link></h3>
        <p className={styles.meta}>{l.categoryName}{l.subcategory ? ` · ${l.subcategory}` : ''}</p>
        <div className={styles.badges}>
          {l.status === 'approved' && <StatusBadge status="approved" label="Live" />}
          {l.status === 'pending' && <StatusBadge status="pending" label="Awaiting approval" />}
          {l.status === 'hidden' && <StatusBadge status="hidden" />}
          {l.featured && <StatusBadge status="featured" />}
        </div>
      </div>
      <dl className={styles.facts}>
        <div><dt>Rate</dt><dd>{formatPKR(l.dailyPrice)} / day</dd></div>
        <div>
          <dt>Rating</dt>
          <dd>{l.rating !== null ? <><Star size={13} fill="currentColor" aria-hidden /> {formatRating(l.rating)} ({l.reviewCount})</> : 'No reviews yet'}</dd>
        </div>
        <div><dt>Rentals</dt><dd>{formatCount(l.bookingCount, 'booking')}</dd></div>
      </dl>
      <div className={styles.actions}>
        <Link to={`/items/${l.id}`} className={styles.view}>View <ArrowUpRight size={15} aria-hidden /></Link>
        <Link to={`/items/${l.id}/edit`} className={styles.action}><Pencil size={14} aria-hidden /> Edit</Link>
        <button type="button" className={`${styles.action} ${styles.danger}`} onClick={() => { setError(''); setConfirming(true); }}><Archive size={14} aria-hidden /> Archive</button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Archive this listing?"
        description={`“${l.title}” will be removed from search and your dashboard. This can’t be done while a booking is pending or approved.`}
        confirmLabel="Archive listing"
        tone="danger"
        loading={busy}
        error={error}
        onConfirm={archive}
        onClose={() => setConfirming(false)}
      />
    </article>
  );
}
