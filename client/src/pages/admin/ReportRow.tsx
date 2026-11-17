import { CheckCheck, EyeOff, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../components/common/Toast';
import { api, ApiError } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import type { AdminReport } from '../../types';
import styles from './Admin.module.css';

export default function ReportRow({ report: r, index, onChanged }: { report: AdminReport; index: number; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmHide, setConfirmHide] = useState(false);
  const [error, setError] = useState('');

  const setStatus = async (status: 'open' | 'resolved') => {
    setBusy(true);
    try {
      await api(`/admin/reports/${r.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      toast.success(status === 'resolved' ? 'Report marked as resolved' : 'Report reopened');
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const hide = async () => {
    setBusy(true);
    setError('');
    try {
      await api(`/admin/listings/${r.listing.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'hidden', reason: 'A report about this listing was reviewed by a moderator.' }) });
      await api(`/admin/reports/${r.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) });
      toast.success('Listing hidden and report resolved');
      setConfirmHide(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={styles.report} style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <div className={styles.reportMain}>
        <p className={styles.reportTitle}>
          <Link to={`/items/${r.listing.id}`}>{r.listing.title}</Link>
          <span>by {r.listing.ownerName}</span>
          {r.listing.status === 'hidden' && <StatusBadge status="hidden" />}
        </p>
        <p className={styles.reason}>{r.reason}</p>
        <p className={styles.reportMeta}>Reported by {r.reporterName} · {formatDateTime(r.createdAt)}</p>
      </div>
      <div className={styles.reportActions}>
        <StatusBadge status={r.status === 'open' ? 'pending' : 'completed'} label={r.status === 'open' ? 'Open' : 'Resolved'} />
        {r.status === 'open' ? (
          <>
            <Button size="sm" onClick={() => void setStatus('resolved')} loading={busy && !confirmHide} iconLeft={<CheckCheck size={15} aria-hidden />}>Mark resolved</Button>
            {r.listing.status === 'approved' && <Button size="sm" variant="outline" onClick={() => { setError(''); setConfirmHide(true); }} iconLeft={<EyeOff size={15} aria-hidden />}>Hide listing</Button>}
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => void setStatus('open')} loading={busy} iconLeft={<RotateCcw size={15} aria-hidden />}>Reopen</Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmHide}
        title="Hide the reported listing?"
        description={`“${r.listing.title}” disappears from search and this report is marked resolved. The owner is notified.`}
        confirmLabel="Hide listing"
        tone="danger"
        loading={busy}
        error={error}
        onConfirm={hide}
        onClose={() => setConfirmHide(false)}
      />
    </li>
  );
}
