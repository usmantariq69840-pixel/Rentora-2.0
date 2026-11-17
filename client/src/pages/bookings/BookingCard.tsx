import { ArrowRight, CalendarDays, TriangleAlert, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListingImage from '../../components/listings/ListingImage';
import StatusBadge from '../../components/common/StatusBadge';
import { artFor } from '../../lib/art';
import { formatDate, formatShort } from '../../lib/dates';
import { formatCount, formatPKR } from '../../lib/format';
import type { Booking } from '../../types';
import BookingActions from './BookingActions';
import styles from './BookingCard.module.css';

interface Props {
  booking: Booking;
  onChanged: () => void;
  /** Show whether the person is renting or lending (for mixed lists such as "Upcoming") */
  showRole?: boolean;
  index?: number;
}

export default function BookingCard({ booking: b, onChanged, showRole = false, index = 0 }: Props) {
  const range = b.startDate === b.endDate ? formatDate(b.startDate) : `${formatShort(b.startDate)} – ${formatDate(b.endDate)}`;
  const person = b.role === 'owner' ? `Requested by ${b.renter.name}` : `Owner: ${b.owner.name}`;

  return (
    <article className={styles.card} style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <Link to={`/bookings/${b.id}`} className={styles.media} tabIndex={-1} aria-hidden="true">
        <ListingImage title={b.listing.title} imageUrl={b.listing.imageUrl} art={artFor(b.listing.categorySlug, b.listing.subcategory)} />
      </Link>

      <div className={styles.main}>
        <div className={styles.top}>
          <h3><Link to={`/bookings/${b.id}`}>{b.listing.title}</Link></h3>
          <StatusBadge status={b.status} />
        </div>
        <p className={styles.person}>
          {person}
          {showRole && <span className={styles.role}>{b.role === 'owner' ? 'You’re lending' : 'You’re renting'}</span>}
        </p>
        <p className={styles.dates}>
          <CalendarDays size={15} aria-hidden /> {range} <span aria-hidden>·</span> {formatCount(b.rentalDays, 'day')}
        </p>
        {b.status === 'approved' && (
          <p className={`${styles.pay} ${b.paymentStatus === 'confirmed' ? styles.paid : ''}`}>
            <Wallet size={14} aria-hidden />
            {b.paymentStatus === 'confirmed' ? 'Demo payment confirmed' : 'Demo payment not confirmed yet'}
          </p>
        )}
        {b.conflict && (
          <p className={styles.conflict}>
            <TriangleAlert size={14} aria-hidden /> These dates now overlap an approved booking.
          </p>
        )}
      </div>

      <div className={styles.side}>
        <p className={styles.total}>
          <strong>{formatPKR(b.rentalTotal)}</strong>
          <span>rental total</span>
        </p>
        <BookingActions booking={b} onChanged={onChanged} size="sm" />
        <Link to={`/bookings/${b.id}`} className={styles.view}>
          View details <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
