import { Check, X } from 'lucide-react';
import { formatDateTime } from '../../lib/format';
import type { BookingDetail } from '../../types';
import styles from './StatusTimeline.module.css';

type StepState = 'done' | 'current' | 'todo' | 'stopped';
interface Step {
  title: string;
  detail?: string;
  state: StepState;
}

function buildSteps(b: BookingDetail): Step[] {
  const at = (s: string) => b.history.find((h) => h.status === s);
  const when = (s: string) => {
    const h = at(s);
    return h ? `${h.byName ?? 'System'} · ${formatDateTime(h.at)}` : undefined;
  };

  const steps: Step[] = [{ title: 'Request sent', detail: when('pending'), state: 'done' }];
  const paid = b.paymentStatus === 'confirmed';

  switch (b.status) {
    case 'pending':
      steps.push(
        { title: 'Owner decision', detail: `Waiting for ${b.owner.name} to approve or decline`, state: 'current' },
        { title: 'Demo payment', state: 'todo' },
        { title: 'Rental completed', state: 'todo' },
      );
      break;
    case 'approved':
      steps.push(
        { title: 'Approved', detail: when('approved'), state: 'done' },
        { title: 'Demo payment', detail: paid ? 'Confirmed (no real money)' : `Waiting for ${b.renter.name} to confirm`, state: paid ? 'done' : 'current' },
        { title: 'Rental completed', detail: paid ? 'After the item is returned, the owner marks it complete' : undefined, state: paid ? 'current' : 'todo' },
      );
      break;
    case 'completed':
      steps.push(
        { title: 'Approved', detail: when('approved'), state: 'done' },
        { title: 'Demo payment', detail: paid ? 'Confirmed (no real money)' : 'Not confirmed', state: paid ? 'done' : 'todo' },
        { title: 'Rental completed', detail: when('completed'), state: 'done' },
      );
      break;
    case 'declined':
      steps.push({ title: 'Declined', detail: when('declined'), state: 'stopped' });
      break;
    case 'cancelled':
      steps.push({ title: 'Cancelled', detail: when('cancelled'), state: 'stopped' });
      break;
  }
  return steps;
}

/** Vertical progress tracker. The connecting lines draw in one after another. */
export default function StatusTimeline({ booking }: { booking: BookingDetail }) {
  const steps = buildSteps(booking);
  return (
    <ol className={styles.list} aria-label="Booking progress">
      {steps.map((step, i) => (
        <li key={step.title} className={`${styles.step} ${styles[step.state]}`} style={{ animationDelay: `${i * 120}ms` }}>
          <span className={styles.node} aria-hidden="true">
            {step.state === 'done' && <Check size={14} strokeWidth={3} />}
            {step.state === 'stopped' && <X size={14} strokeWidth={3} />}
            {step.state === 'current' && <span className={styles.pulse} />}
          </span>
          <div>
            <strong>{step.title}</strong>
            <span className="sr-only">{` — ${step.state === 'done' ? 'done' : step.state === 'current' ? 'in progress' : step.state === 'stopped' ? 'stopped' : 'not yet'}`}</span>
            {step.detail && <p>{step.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
