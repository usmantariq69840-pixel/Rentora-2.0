import styles from './SkeletonCard.module.css';

/** Loading placeholder with the same proportions as <ListingCard>. */
export default function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.shimmer} ${styles.image}`} />
      <div className={styles.body}>
        <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '80%' }} />
        <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '45%' }} />
        <div className={`${styles.shimmer} ${styles.line}`} style={{ width: '60%', height: 20 }} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
