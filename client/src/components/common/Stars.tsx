import { Star } from 'lucide-react';
import styles from './Stars.module.css';

/** Five-star display for a whole-number rating (used in reviews). */
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? styles.on : styles.off} fill="currentColor" aria-hidden />
      ))}
    </span>
  );
}
