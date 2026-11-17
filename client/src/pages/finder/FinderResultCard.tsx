import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '../../components/common/Button';
import ListingCard from '../../components/listings/ListingCard';
import { formatPKR } from '../../lib/format';
import type { FinderCriteria, FinderResult } from '../../types';
import styles from './FinderResultCard.module.css';

interface Props {
  result: FinderResult;
  criteria: FinderCriteria;
  index: number;
}

/** A normal listing card plus the reasons it matched. The reasons and totals are computed from the listing's real data. */
export default function FinderResultCard({ result, criteria, index }: Props) {
  const { listing, reasons, estimate } = result;
  const dates = criteria.startDate && criteria.endDate ? `?from=${criteria.startDate}&to=${criteria.endDate}` : '';
  return (
    <article className={styles.wrap} style={{ animationDelay: `${Math.min(index, 8) * 90}ms` }}>
      <ListingCard listing={listing} />
      <div className={styles.why}>
        <p className={styles.heading}>Why it matches</p>
        <ul>
          {reasons.map((r) => (
            <li key={r}><Check size={15} aria-hidden /> <span>{r}</span></li>
          ))}
        </ul>
        {estimate && (
          <p className={styles.estimate}>
            <span>{estimate.days} {estimate.days === 1 ? 'day' : 'days'}</span>
            <strong>{formatPKR(estimate.rentalTotal)}</strong>
            <small>+ {formatPKR(estimate.deposit)} refundable deposit (demo)</small>
          </p>
        )}
        <ButtonLink to={`/items/${listing.id}${dates}`} variant="outline" size="sm" fullWidth iconRight={<ArrowRight size={16} aria-hidden />}>
          {dates ? 'Check these dates' : 'View and request'}
        </ButtonLink>
      </div>
    </article>
  );
}
