import { Ban, BadgeCheck, CheckCircle2, CircleDashed, Clock, EyeOff, Sparkles, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './StatusBadge.module.css';

export type Status =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'completed'
  | 'featured'
  | 'hidden'
  | 'verified'
  | 'unverified';

const config: Record<Status, { label: string; icon: ReactNode }> = {
  pending: { label: 'Pending', icon: <Clock size={13} aria-hidden /> },
  approved: { label: 'Approved', icon: <CheckCircle2 size={13} aria-hidden /> },
  declined: { label: 'Declined', icon: <XCircle size={13} aria-hidden /> },
  cancelled: { label: 'Cancelled', icon: <Ban size={13} aria-hidden /> },
  completed: { label: 'Completed', icon: <BadgeCheck size={13} aria-hidden /> },
  featured: { label: 'Featured', icon: <Sparkles size={13} aria-hidden /> },
  hidden: { label: 'Hidden', icon: <EyeOff size={13} aria-hidden /> },
  verified: { label: 'Verified (demo)', icon: <BadgeCheck size={13} aria-hidden /> },
  unverified: { label: 'Not verified (demo)', icon: <CircleDashed size={13} aria-hidden /> },
};

/** Status is always shown with an icon and text, never colour alone. */
export default function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const item = config[status];
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {item.icon}
      {label ?? item.label}
    </span>
  );
}
