import { Star } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';
import { formatMonthYear } from '../../lib/dates';
import { formatRating } from '../../lib/format';
import Stars from '../../components/common/Stars';
import type { ListingDetail } from '../../types';
import styles from './Reviews.module.css';

export default function Reviews({ item }: { item: ListingDetail }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const max = Math.max(1, ...item.ratingBreakdown.map((b) => b.count));

  if (item.reviewCount === 0) {
    return <p className={styles.none}>No reviews yet. Reviews appear after a completed rental.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div ref={ref} className={styles.summary}>
        <div className={styles.score}>
          <strong>{formatRating(item.rating ?? 0)}</strong>
          <Stars value={item.rating ?? 0} size={18} />
          <span>{item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}</span>
        </div>
        <ul className={styles.bars} aria-label="Rating breakdown">
          {item.ratingBreakdown.map((b) => (
            <li key={b.stars}>
              <span>{b.stars} <Star size={12} fill="currentColor" aria-hidden /></span>
              <i className={styles.track}><b style={{ width: visible ? `${(b.count / max) * 100}%` : '0%' }} /></i>
              <span className={styles.n}>{b.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.list}>
        {item.reviews.map((r) => (
          <li key={r.id} className={styles.review}>
            <span className={styles.avatar} aria-hidden>{r.reviewerName.charAt(0)}</span>
            <div>
              <p className={styles.who}><strong>{r.reviewerName}</strong> <time dateTime={r.createdAt}>{formatMonthYear(r.createdAt.slice(0, 10))}</time></p>
              <Stars value={r.rating} size={14} />
              {r.comment && <p className={styles.comment}>{r.comment}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
