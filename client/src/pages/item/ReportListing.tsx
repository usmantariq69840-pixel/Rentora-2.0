import { Flag, Send } from 'lucide-react';
import { useState } from 'react';
import SignInPrompt from '../../components/auth/SignInPrompt';
import Button from '../../components/common/Button';
import { TextArea } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import type { ListingDetail } from '../../types';
import styles from './ReportListing.module.css';

/** "Report this listing" link and dialog. Reports go to the admin Reports tab. */
export default function ReportListing({ item }: { item: ListingDetail }) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (item.status !== 'approved' || user?.id === item.ownerId) return null;

  const close = () => { if (!busy) { setOpen(false); setError(''); } };

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/items/${item.id}/report`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) });
      toast.success('Thanks, a moderator will take a look');
      setOpen(false);
      setReason('');
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields?.[0]?.message ?? err.message) : 'We couldn’t send your report. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        <Flag size={15} aria-hidden /> Report this listing
      </button>

      {user ? (
        <Modal
          open={open}
          onClose={close}
          title="Report this listing"
          description="Tell us what looks wrong. A moderator on the demo admin account will review it."
          footer={
            <>
              <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
              <Button onClick={() => void send()} loading={busy} disabled={reason.trim().length < 10} iconLeft={<Send size={18} aria-hidden />}>Send report</Button>
            </>
          }
        >
          <TextArea label="What’s the problem?" value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} maxLength={400} rows={4} placeholder="For example: the photos don’t match the description." hint={`${reason.trim().length < 10 ? 'At least 10 characters. ' : ''}${reason.length}/400`} error={error} />
        </Modal>
      ) : (
        <SignInPrompt open={open} onClose={() => setOpen(false)} next={`/items/${item.id}`} message="Sign in to report a listing, so moderators can follow up if they need to." />
      )}
    </>
  );
}
