import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import styles from './StarRating.module.css';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface Props {
  value: number;
  onChange: (value: number) => void;
  label: string;
  error?: string;
  disabled?: boolean;
}

/**
 * A real radio group dressed as stars, so it works with the keyboard (arrow keys) and screen readers.
 * Hovering previews a rating before it is chosen.
 */
export default function StarRating({ value, onChange, label, error, disabled }: Props) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <fieldset className={styles.field} disabled={disabled} aria-describedby={error ? `${name}-error` : undefined}>
      <legend>{label}</legend>
      <div className={styles.row} onMouseLeave={() => setHover(0)}>
        <div className={styles.stars} role="radiogroup" aria-label={label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`${styles.star} ${n <= shown ? styles.on : ''}`} onMouseEnter={() => setHover(n)}>
              <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} aria-label={`${n} star${n === 1 ? '' : 's'}, ${LABELS[n]}`} />
              <Star size={30} fill="currentColor" aria-hidden />
            </label>
          ))}
        </div>
        <span className={styles.word} aria-live="polite">{shown ? LABELS[shown] : 'Choose a rating'}</span>
      </div>
      {error && <p id={`${name}-error`} className={styles.error} role="alert">{error}</p>}
    </fieldset>
  );
}
