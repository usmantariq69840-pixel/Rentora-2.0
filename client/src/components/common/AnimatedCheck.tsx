import styles from './AnimatedCheck.module.css';

/** A circle that draws itself, then a check mark. Used for "request sent" style success states. */
export default function AnimatedCheck({ size = 72 }: { size?: number }) {
  return (
    <svg className={styles.check} width={size} height={size} viewBox="0 0 52 52" aria-hidden="true">
      <circle className={styles.circle} cx="26" cy="26" r="24" fill="none" />
      <path className={styles.tick} fill="none" d="M15 27l8 8 15-17" />
    </svg>
  );
}
