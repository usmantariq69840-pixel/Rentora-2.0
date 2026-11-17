import { AlertTriangle, CalendarDays, Info, MapPin, ShieldAlert, ShieldCheck, SearchX, TriangleAlert, Wallet } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Button, { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/PageLoader';
import Reveal from '../components/common/Reveal';
import StatusBadge from '../components/common/StatusBadge';
import ListingImage from '../components/listings/ListingImage';
import { useApi } from '../hooks/useApi';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { artFor } from '../lib/art';
import { formatDate, formatLong } from '../lib/dates';
import { formatCount, formatDateTime, formatPKR } from '../lib/format';
import type { BookingDetail as Detail, BookingPerson } from '../types';
import BookingActions from './bookings/BookingActions';
import ReviewSection from './bookings/ReviewSection';
import StatusTimeline from './bookings/StatusTimeline';
import styles from './BookingDetail.module.css';

/** One sentence that tells this person what happens next. */
function nextStep(b: Detail): { tone: 'info' | 'action' | 'done' | 'warn'; text: string } {
  const isOwner = b.role === 'owner';
  switch (b.status) {
    case 'pending':
      if (isOwner && b.conflict) return { tone: 'warn', text: 'These dates now overlap another approved booking, so this request can no longer be approved. You can decline it.' };
      return isOwner
        ? { tone: 'action', text: `${b.renter.name} is waiting for your reply. Approve or decline this request below.` }
        : { tone: 'info', text: `Waiting for ${b.owner.name} to respond. You can cancel while the request is pending.` };
    case 'approved':
      if (isOwner) return { tone: 'info', text: `Hand the item over on ${formatLong(b.startDate)}. After it’s returned, mark the rental as returned.` };
      return b.paymentStatus === 'none'
        ? { tone: 'action', text: 'Approved! Confirm the demo payment to finish. No real money is charged.' }
        : { tone: 'done', text: `All confirmed. Collect the item on ${formatLong(b.startDate)}.` };
    case 'completed':
      return { tone: 'done', text: 'This rental is complete. Thanks for using Rentora.' };
    case 'declined':
      return { tone: 'info', text: 'This request was declined. The dates stay open for other renters.' };
    case 'cancelled':
      return { tone: 'info', text: 'This request was cancelled. The dates stay open for other renters.' };
  }
}

function Person({ label, person }: { label: string; person: BookingPerson }) {
  return (
    <div className={styles.person}>
      <Avatar name={person.name} size={46} />
      <div>
        <span className={styles.personLabel}>{label}</span>
        <strong>{person.name}</strong>
        <div className={styles.badges}>
          <StatusBadge status={person.emailVerifiedDemo ? 'verified' : 'unverified'} label={person.emailVerifiedDemo ? 'Email verified (demo)' : 'Email not verified (demo)'} />
          <StatusBadge status={person.phoneVerifiedDemo ? 'verified' : 'unverified'} label={person.phoneVerifiedDemo ? 'Phone verified (demo)' : 'Phone not verified (demo)'} />
        </div>
      </div>
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const valid = !!id && /^\d+$/.test(id);
  const { data, error, loading, retry } = useApi<{ booking: Detail }>(valid ? `/bookings/${id}` : null);
  const b = data?.booking;
  useDocumentTitle(b ? `Booking #${b.id}` : 'Booking');

  const status = error && 'status' in error ? error.status : 0;
  if (!valid || status === 404) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState icon={<SearchX size={30} aria-hidden />} title="Booking not found" description="This booking doesn’t exist or has been removed." action={<ButtonLink to="/bookings">Back to my bookings</ButtonLink>} />
      </div>
    );
  }
  if (status === 403) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState icon={<ShieldAlert size={30} aria-hidden />} title="You don’t have access to this booking" description="Only the renter and the owner of a booking can see its details." action={<ButtonLink to="/bookings">Back to my bookings</ButtonLink>} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <EmptyState icon={<AlertTriangle size={30} aria-hidden />} title="We couldn’t load this booking" description="Check that the API is running, then try again." action={<Button onClick={retry}>Try again</Button>} />
      </div>
    );
  }
  if (loading && !b) return <PageLoader label="Loading booking…" />;
  if (!b) return null;

  const step = nextStep(b);
  const sameDay = b.startDate === b.endDate;
  const other = b.role === 'owner' ? b.renter : b.owner;

  return (
    <div className={`${styles.page} container`}>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My bookings', to: '/bookings' }, { label: `Booking #${b.id}` }]} />

      <header className={styles.header}>
        <div>
          <h1>{b.listing.title}</h1>
          <p>
            Booking #{b.id} · requested {formatDateTime(b.createdAt)} · {b.role === 'owner' ? `from ${b.renter.name}` : `with ${b.owner.name}`}
          </p>
        </div>
        <StatusBadge status={b.status} />
      </header>

      <p className={`${styles.callout} ${styles[step.tone]}`} role="status">
        {step.tone === 'warn' ? <TriangleAlert size={20} aria-hidden /> : <Info size={20} aria-hidden />}
        <span>{step.text}</span>
      </p>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Reveal><section className={styles.card}>
            <h2>Progress</h2>
            <StatusTimeline booking={b} />
          </section></Reveal>

          <Reveal><section className={styles.card}>
            <h2>Item</h2>
            <div className={styles.item}>
              <div className={styles.thumb}>
                <ListingImage title={b.listing.title} imageUrl={b.listing.imageUrl} art={artFor(b.listing.categorySlug, b.listing.subcategory)} />
              </div>
              <div>
                <h3><Link to={`/items/${b.listing.id}`}>{b.listing.title}</Link></h3>
                <p className={styles.loc}><MapPin size={15} aria-hidden /> {b.listing.location}</p>
                <Link to={`/items/${b.listing.id}`} className={styles.viewLink}>View listing</Link>
              </div>
            </div>
          </section></Reveal>

          {b.status === 'completed' && <Reveal><ReviewSection booking={b} onChanged={retry} /></Reveal>}

          <Reveal><section className={styles.card}>
            <h2>People</h2>
            <div className={styles.people}>
              <Person label="Renter" person={b.renter} />
              <Person label="Owner" person={b.owner} />
            </div>
            <p className={styles.fine}>
              <ShieldCheck size={15} aria-hidden /> Verification labels are demo data. Rentora never asks for identity documents.
            </p>
          </section></Reveal>
        </div>

        <aside className={styles.summary} aria-label="Booking summary">
          <h2>Summary</h2>
          <p className={styles.range}>
            <CalendarDays size={18} aria-hidden />
            <span>
              {sameDay ? formatDate(b.startDate) : `${formatDate(b.startDate)} – ${formatDate(b.endDate)}`}
              <small>{formatCount(b.rentalDays, 'day')}</small>
            </span>
          </p>
          <dl>
            <div><dt>{formatPKR(b.dailyPrice)} × {formatCount(b.rentalDays, 'day')}</dt><dd>{formatPKR(b.rentalTotal)}</dd></div>
            <div><dt>Refundable deposit (demo)</dt><dd>{formatPKR(b.deposit)}</dd></div>
            <div className={styles.total}><dt>Total with deposit</dt><dd>{formatPKR(b.rentalTotal + b.deposit)}</dd></div>
          </dl>

          <p className={`${styles.payment} ${b.paymentStatus === 'confirmed' ? styles.paid : ''}`}>
            <Wallet size={16} aria-hidden />
            {b.status === 'pending' || b.status === 'declined' || b.status === 'cancelled'
              ? 'Demo payment opens after approval'
              : b.paymentStatus === 'confirmed' ? 'Demo payment confirmed' : 'Demo payment not confirmed yet'}
          </p>

          <BookingActions booking={b} onChanged={retry} stacked size="lg" />
          {b.actions.length === 0 && (
            <ButtonLink to={`/items/${b.listing.id}`} variant="outline" fullWidth>
              {b.role === 'renter' ? `Rent again from ${other.name.split(' ')[0]}` : 'View listing'}
            </ButtonLink>
          )}
          <p className={styles.demo}>Demo only — no real money, card or bank details are involved. Prices are in PKR.</p>
        </aside>
      </div>
    </div>
  );
}
