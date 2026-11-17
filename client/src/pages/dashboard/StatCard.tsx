import type { ReactNode } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import styles from './StatCard.module.css';

interface Props {
  icon: ReactNode;
  label: string;
  value: number;
  /** Formats the animated number, e.g. as rupees */
  format?: (n: number) => string;
  note?: string;
  tone?: 'default' | 'attention' | 'accent';
  onClick?: () => void;
  index?: number;
}

/** A figure that counts up when it appears. Clickable cards act as shortcuts to a tab. */
export default function StatCard({ icon, label, value, format, note, tone = 'default', onClick, index = 0 }: Props) {
  const shown = useCountUp(value);
  const body = (
    <>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value} aria-label={`${label}: ${format ? format(value) : value}`}>
        <span aria-hidden="true">{format ? format(shown) : shown}</span>
      </strong>
      {note && <span className={styles.note}>{note}</span>}
    </>
  );
  const className = `${styles.card} ${styles[tone]}`;
  const style = { animationDelay: `${index * 80}ms` };
  return onClick ? (
    <button type="button" className={`${className} ${styles.clickable}`} style={style} onClick={onClick}>{body}</button>
  ) : (
    <div className={className} style={style}>{body}</div>
  );
}
