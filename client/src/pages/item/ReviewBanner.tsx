import { CheckCircle2, EyeOff, Hourglass, Pencil, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Button, { ButtonLink } from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import type { ListingDetail } from '../../types';
import styles from './ReviewBanner.module.css';

/**
 * Shown above a listing that only its owner and admins can see (pending or hidden), and gives owners an Edit button.
 * Admins can approve or hide from here, or use the full review queue on the Admin page.
 */
export default function ReviewBanner({ item, onChanged }: { item: ListingDetail; onChanged: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState<'approved' | 'hidden' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isOwner = !!user && user.id === item.ownerId;
  const isAdmin = user?.role === 'admin';
  if (!isOwner && !isAdmin) return null;
  if (item.status === 'approved' && !isOwner) return null;

  const decide = async () => {
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      await api(`/admin/listings/${item.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: pending }) });
      toast.success(pending === 'approved' ? 'Listing approved. It’s now live.' : 'Listing hidden');
      setPending(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn’t update the listing. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const tone = item.status === 'approved' ? styles.ok : item.status === 'hidden' ? styles.hidden : styles.wait;
  const Icon = item.status === 'approved' ? CheckCircle2 : item.status === 'hidden' ? EyeOff : Hourglass;

  return (
    <aside className={`${styles.banner} ${tone}`} aria-label="Listing status">
      <Icon size={22} aria-hidden />
      <div className={styles.text}>
        {item.status === 'pending' && (
          <>
            <p><strong>{isAdmin ? 'Waiting for your review' : 'Waiting for admin approval'}</strong></p>
            <p>{isAdmin ? 'Only the owner and admins can see this listing until it’s approved.' : 'Only you and admins can see this listing until it’s approved. You’ll get a notification.'}</p>
          </>
        )}
        {item.status === 'hidden' && (
          <>
            <p><strong>This listing is hidden</strong></p>
            <p>{isOwner && !isAdmin ? 'A moderator hid it, so it isn’t in search. Edit it and ask for another look.' : 'It isn’t shown in search. Approve it to bring it back.'}</p>
          </>
        )}
        {item.status === 'approved' && (
          <>
            <p><strong>This is your listing</strong></p>
            <p>It’s live. Changes you save show up straight away in this demo.</p>
          </>
        )}
      </div>
      <div className={styles.actions}>
        {isOwner && <ButtonLink to={`/items/${item.id}/edit`} variant="outline" size="sm" iconLeft={<Pencil size={15} aria-hidden />}>Edit listing</ButtonLink>}
        {isAdmin && item.status !== 'approved' && <Button size="sm" onClick={() => { setError(''); setPending('approved'); }} iconLeft={<ShieldCheck size={15} aria-hidden />}>Approve</Button>}
        {isAdmin && item.status === 'pending' && <Button size="sm" variant="outline" onClick={() => { setError(''); setPending('hidden'); }} iconLeft={<EyeOff size={15} aria-hidden />}>Hide</Button>}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending === 'approved' ? 'Approve this listing?' : 'Hide this listing?'}
        description={pending === 'approved' ? 'It will appear in search and renters can send requests. The owner is notified.' : 'It stays out of search. The owner is notified and can edit it.'}
        confirmLabel={pending === 'approved' ? 'Approve listing' : 'Hide listing'}
        tone={pending === 'approved' ? 'primary' : 'danger'}
        loading={busy}
        error={error}
        onConfirm={decide}
        onClose={() => setPending(null)}
      />
    </aside>
  );
}
