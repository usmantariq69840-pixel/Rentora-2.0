import { CheckCircle2, ChevronDown, ExternalLink, EyeOff, Flag, MapPin, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { TextArea } from '../../components/common/Input';
import { useToast } from '../../components/common/Toast';
import ListingImage from '../../components/listings/ListingImage';
import { api, ApiError } from '../../lib/api';
import { artFor } from '../../lib/art';
import { formatDateTime, formatPKR } from '../../lib/format';
import type { AdminListing } from '../../types';
import styles from './ModerationCard.module.css';

interface Props {
  listing: AdminListing;
  index: number;
  onChanged: () => void;
}

/** One listing in the review queue: enough detail to decide, plus Approve / Hide. */
export default function ModerationCard({ listing: l, index, onChanged }: Props) {
  const toast = useToast();
  const [photo, setPhoto] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const decide = async (status: 'approved' | 'hidden') => {
    setBusy(true);
    setError('');
    try {
      await api(`/admin/listings/${l.id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason: status === 'hidden' ? reason.trim() : undefined }) });
      toast.success(status === 'approved' ? `“${l.title}” approved` : `“${l.title}” hidden`);
      setApproving(false);
      setHiding(false);
      setReason('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? (err.fields?.[0]?.message ?? err.message) : 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const long = l.description.length > 220;
  const description = expanded || !long ? l.description : `${l.description.slice(0, 220).trimEnd()}…`;

  return (
    <article className={styles.card} style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }} aria-labelledby={`mod-${l.id}`}>
      <div className={styles.media}>
        <div className={styles.photo}>
          <ListingImage title={l.title} imageUrl={l.images[photo]} art={artFor(l.categorySlug, l.subcategory)} />
        </div>
        {l.images.length > 1 && (
          <div className={styles.thumbs} role="group" aria-label="Photos">
            {l.images.map((src, i) => (
              <button key={src} type="button" onClick={() => setPhoto(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === photo} className={i === photo ? styles.thumbOn : ''}>
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        {l.images.length === 0 && <p className={styles.noPhoto}>No photos uploaded</p>}
      </div>

      <div className={styles.body}>
        <header className={styles.head}>
          <div>
            <h3 id={`mod-${l.id}`}>{l.title}</h3>
            <p className={styles.meta}>{l.categoryName}{l.subcategory ? ` · ${l.subcategory}` : ''} · {l.condition} · submitted {formatDateTime(l.createdAt)}</p>
          </div>
          <div className={styles.badges}>
            {l.status === 'pending' && <StatusBadge status="pending" label="Awaiting review" />}
            {l.status === 'approved' && <StatusBadge status="approved" label="Live" />}
            {l.status === 'hidden' && <StatusBadge status="hidden" />}
            {l.openReports > 0 && <span className={styles.flag}><Flag size={13} aria-hidden /> {l.openReports} open {l.openReports === 1 ? 'report' : 'reports'}</span>}
          </div>
        </header>

        <dl className={styles.facts}>
          <div><dt>Price</dt><dd>{formatPKR(l.dailyPrice)} / day</dd></div>
          <div><dt>Deposit (demo)</dt><dd>{formatPKR(l.depositAmount)}</dd></div>
          <div><dt>Pickup</dt><dd><MapPin size={13} aria-hidden /> {l.location}</dd></div>
        </dl>

        <p className={styles.description}>{description}</p>
        {long && (
          <button type="button" className={styles.more} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : 'Show more'} <ChevronDown size={14} aria-hidden className={expanded ? styles.flip : ''} />
          </button>
        )}

        {(l.specs.length > 0 || l.tags.length > 0) && (
          <div className={styles.chips}>
            {l.specs.map((s) => <span key={s.label} className={styles.spec}><b>{s.label}:</b> {s.value}</span>)}
            {l.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
          </div>
        )}

        <div className={styles.owner}>
          <Avatar name={l.owner.name} size={34} />
          <div>
            <strong>{l.owner.name}</strong>
            <span>{l.owner.emailVerifiedDemo ? 'Email verified (demo)' : 'Email not verified (demo)'} · {l.owner.phoneVerifiedDemo ? 'Phone verified (demo)' : 'Phone not verified (demo)'}</span>
          </div>
        </div>

        <footer className={styles.actions}>
          {l.status !== 'approved' && <Button onClick={() => { setError(''); setApproving(true); }} iconLeft={<ShieldCheck size={18} aria-hidden />}>Approve</Button>}
          {l.status !== 'hidden' && <Button variant="outline" onClick={() => { setError(''); setHiding(true); }} iconLeft={<EyeOff size={18} aria-hidden />}>Hide</Button>}
          <Link to={`/items/${l.id}`} className={styles.open}>Open full listing <ExternalLink size={14} aria-hidden /></Link>
        </footer>
      </div>

      <ConfirmDialog
        open={approving}
        title="Approve this listing?"
        description="It will appear in search and renters can send requests. The owner is notified."
        confirmLabel="Approve listing"
        loading={busy}
        error={error}
        onConfirm={() => decide('approved')}
        onClose={() => setApproving(false)}
      />

      <Modal
        open={hiding}
        onClose={() => !busy && setHiding(false)}
        title="Hide this listing?"
        description="It disappears from search and any featured promotion ends. The owner is notified and can edit it."
        footer={
          <>
            <Button variant="outline" onClick={() => setHiding(false)} disabled={busy}>Keep as is</Button>
            <Button variant="danger" onClick={() => void decide('hidden')} loading={busy} iconLeft={<CheckCircle2 size={18} aria-hidden />}>Hide listing</Button>
          </>
        }
      >
        <TextArea label="Reason for the owner (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} placeholder="For example: the photos don’t show the actual item." hint={`${reason.length}/300`} />
        {error && <p role="alert" style={{ marginTop: 12, color: 'var(--danger)', fontWeight: 500, fontSize: 'var(--text-small)' }}>{error}</p>}
      </Modal>
    </article>
  );
}
