import { ShieldCheck } from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import { formatMonthYear } from '../../lib/dates';
import type { AdminUser } from '../../types';
import styles from './Admin.module.css';

/** Read-only list. The admin account can't view or change anyone's password. */
export default function UsersTab({ users }: { users: AdminUser[] }) {
  return (
    <>
      <ul className={styles.users}>
        {users.map((u, i) => (
          <li key={u.id} className={styles.user} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
            <Avatar name={u.name} size={42} />
            <div className={styles.userMain}>
              <p><strong>{u.name}</strong> {u.role === 'admin' && <span className={styles.admin}><ShieldCheck size={13} aria-hidden /> Admin</span>}</p>
              <p className={styles.email}>{u.email}</p>
              <p className={styles.userBadges}>
                <StatusBadge status={u.emailVerifiedDemo ? 'verified' : 'unverified'} label={u.emailVerifiedDemo ? 'Email verified (demo)' : 'Email not verified (demo)'} />
                <StatusBadge status={u.phoneVerifiedDemo ? 'verified' : 'unverified'} label={u.phoneVerifiedDemo ? 'Phone verified (demo)' : 'Phone not verified (demo)'} />
              </p>
            </div>
            <dl className={styles.userStats}>
              <div><dt>Listings</dt><dd>{u.listings}</dd></div>
              <div><dt>Rented</dt><dd>{u.rentalsTaken}</dd></div>
              <div><dt>Lent</dt><dd>{u.rentalsGiven}</dd></div>
              <div><dt>Joined</dt><dd>{formatMonthYear(u.memberSince.slice(0, 10))}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
      <p className={styles.fine}>Verification labels are demo data. This list is read-only, and no passwords are ever shown.</p>
    </>
  );
}
