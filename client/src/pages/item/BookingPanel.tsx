import { CalendarDays, Clock, Info, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AnimatedCheck from '../../components/common/AnimatedCheck';
import Button, { ButtonLink } from '../../components/common/Button';
import DateRangePicker from '../../components/common/DateRangePicker';
import Modal from '../../components/common/Modal';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { formatDate, formatShort, isIsoDate, MAX_RENTAL_DAYS, rangesOverlap, rentalDays, todayISO } from '../../lib/dates';
import { formatCount, formatPKR } from '../../lib/format';
import type { BookingDetail, ListingDetail } from '../../types';
import styles from './BookingPanel.module.css';

interface Props {
  item: ListingDetail;
  /** Reload the listing (for example when the server says the dates were just taken) */
  onRefresh: () => void;
}

/** Dates from a shared link or a return from sign-in (?from=…&to=…), only if still usable. */
function initialDates(item: ListingDetail, from: string | null, to: string | null): [string | null, string | null] {
  if (!isIsoDate(from) || !isIsoDate(to) || from < todayISO() || to < from) return [null, null];
  if (rentalDays(from, to) > MAX_RENTAL_DAYS) return [null, null];
  if (item.unavailable.some((r) => rangesOverlap(from, to, r.start, r.end))) return [null, null];
  return [from, to];
}

/**
 * Date selection, price summary and the booking request. Guests are asked to sign in first
 * (and return here with their dates kept). The server validates everything again.
 */
export default function BookingPanel({ item, onRefresh }: Props) {
  const navigate = useNavigate();
  const { user, requireSignIn } = useAuth();
  const [params] = useSearchParams();
  const [initialStart, initialEnd] = initialDates(item, params.get('from'), params.get('to'));

  const [start, setStart] = useState<string | null>(initialStart);
  const [end, setEnd] = useState<string | null>(initialEnd);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<BookingDetail | null>(null);

  const days = start && end ? rentalDays(start, end) : 0;
  const tooLong = days > MAX_RENTAL_DAYS;
  const rentalTotal = days * item.dailyPrice;
  const isOwner = user?.id === item.ownerId;
  const live = item.status === 'approved';

  const request = () => {
    if (days === 0 || tooLong) return;
    if (!requireSignIn('Sign in to send a booking request for this item.', `/items/${item.id}?from=${start}&to=${end}`)) return;
    setError(null);
    setConfirmOpen(true);
  };

  const send = async () => {
    if (!start || !end) return;
    setBusy(true);
    setError(null);
    try {
      const { booking } = await api<{ booking: BookingDetail }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({ listingId: item.id, startDate: start, endDate: end }),
      });
      setSent(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      if (err instanceof ApiError && err.status === 409) onRefresh(); // the calendar may be out of date
    } finally {
      setBusy(false);
    }
  };

  const closeDialog = () => {
    if (busy) return;
    setConfirmOpen(false);
    if (sent) {
      setSent(null);
      setStart(null);
      setEnd(null);
    }
  };

  return (
    <aside id="booking" className={styles.panel} aria-label="Booking">
      <p className={styles.price}>
        <strong>{formatPKR(item.dailyPrice)}</strong> <span>/ day</span>
      </p>

      <div className={styles.fields}>
        <div className={`${styles.field} ${start ? styles.filled : ''}`}>
          <span>Start</span>
          <b>{start ? formatShort(start) : 'Select date'}</b>
        </div>
        <div className={`${styles.field} ${end ? styles.filled : ''}`}>
          <span>End</span>
          <b>{end ? formatShort(end) : 'Select date'}</b>
        </div>
      </div>

      <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} unavailable={item.unavailable} />

      {item.unavailable.length > 0 && (
        <p className={styles.blockedNote}>
          <CalendarDays size={15} aria-hidden />
          <span>Already booked: {item.unavailable.map((r) => (r.start === r.end ? formatShort(r.start) : `${formatShort(r.start)} – ${formatShort(r.end)}`)).join(', ')}</span>
        </p>
      )}

      {days > 0 && start && end ? (
        <dl className={styles.summary} aria-live="polite">
          <div><dt>{formatPKR(item.dailyPrice)} × {formatCount(days, 'day')}</dt><dd>{formatPKR(rentalTotal)}</dd></div>
          <div><dt>Refundable deposit (demo)</dt><dd>{formatPKR(item.depositAmount)}</dd></div>
          <div className={styles.total}><dt>Estimated total</dt><dd>{formatPKR(rentalTotal + item.depositAmount)}</dd></div>
          <p className={styles.range}>{formatDate(start)} – {formatDate(end)}</p>
        </dl>
      ) : (
        <p className={styles.prompt}>Select your start and end dates to see the price.</p>
      )}

      {tooLong && <p className={styles.problem} role="alert">Rentals can be at most {MAX_RENTAL_DAYS} days. Please choose a shorter range.</p>}

      {isOwner ? (
        <div className={styles.ownerNote}>
          <p><LayoutDashboard size={16} aria-hidden /> This is your listing, so you can’t request it. Renters send requests here and you reply from your dashboard.</p>
          <ButtonLink to="/dashboard" variant="outline" fullWidth>Open dashboard</ButtonLink>
        </div>
      ) : !live ? (
        <p className={styles.ownerNote}><Clock size={16} aria-hidden /> This listing is waiting for approval, so it can’t be booked yet.</p>
      ) : (
        <Button fullWidth size="lg" disabled={days === 0 || tooLong} onClick={request}>Request to rent</Button>
      )}

      <ul className={styles.notes}>
        <li><ShieldCheck size={16} aria-hidden /> You’re not charged. The owner must approve your request first.</li>
        <li><Info size={16} aria-hidden /> Demo only — no real money, deposits or payments are involved.</li>
      </ul>

      <Modal
        open={confirmOpen}
        onClose={closeDialog}
        title={sent ? 'Request sent' : 'Send booking request?'}
        description={sent ? undefined : `${item.owner.name} will review your request and reply. You won’t be charged.`}
        size="sm"
        footer={
          sent ? (
            <>
              <Button variant="outline" onClick={closeDialog}>Keep browsing</Button>
              <Button onClick={() => { closeDialog(); navigate(`/bookings/${sent.id}`); }}>View my request</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={closeDialog} disabled={busy}>Go back</Button>
              <Button onClick={send} loading={busy}>Send request</Button>
            </>
          )
        }
      >
        {sent ? (
          <div className={styles.sent}>
            <AnimatedCheck />
            <p><strong>{item.owner.name}</strong> has been notified. You’ll get an update here as soon as they approve or decline.</p>
          </div>
        ) : (
          start && end && (
            <dl className={styles.confirmList}>
              <div><dt>Item</dt><dd>{item.title}</dd></div>
              <div><dt>Dates</dt><dd>{start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`}</dd></div>
              <div><dt>{formatCount(days, 'day')} × {formatPKR(item.dailyPrice)}</dt><dd>{formatPKR(rentalTotal)}</dd></div>
              <div><dt>Refundable deposit (demo)</dt><dd>{formatPKR(item.depositAmount)}</dd></div>
              {error && <p role="alert" className={styles.problem}>{error}</p>}
            </dl>
          )
        )}
      </Modal>
    </aside>
  );
}
