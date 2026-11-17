import { BadgeCheck } from 'lucide-react';
import { formatMonthYear } from '../../lib/dates';
import { formatCount } from '../../lib/format';
import type { ListingDetail } from '../../types';
import styles from './OwnerCard.module.css';

export default function OwnerCard({ owner }: { owner: ListingDetail['owner'] }) {
  return (
    <div className={styles.card}>
      <span className={styles.avatar} aria-hidden>{owner.name.charAt(0)}</span>
      <div className={styles.info}>
        <h3>{owner.name}</h3>
        <p>Member since {formatMonthYear(owner.memberSince.slice(0, 10))} · {formatCount(owner.listingCount, 'active listing')}</p>
        <ul>
          {owner.emailVerifiedDemo && <li><BadgeCheck size={14} aria-hidden /> Email verified (demo)</li>}
          {owner.phoneVerifiedDemo && <li><BadgeCheck size={14} aria-hidden /> Phone verified (demo)</li>}
          {!owner.emailVerifiedDemo && !owner.phoneVerifiedDemo && <li className={styles.none}>Not verified yet (demo)</li>}
        </ul>
      </div>
    </div>
  );
}
