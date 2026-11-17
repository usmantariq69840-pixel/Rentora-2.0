import { Ban, Check, PackageCheck, Wallet, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import { api } from '../../lib/api';
import { ACTIONS } from '../../lib/bookings';
import type { BookingAction } from '../../types';
import styles from './BookingActions.module.css';

const ICONS: Record<BookingAction, ReactNode> = {
  approve: <Check size={18} aria-hidden />,
  decline: <X size={18} aria-hidden />,
  cancel: <Ban size={18} aria-hidden />,
  complete: <PackageCheck size={18} aria-hidden />,
  pay: <Wallet size={18} aria-hidden />,
};

interface Props {
  booking: { id: number; actions: BookingAction[]; renter: { name: string }; owner: { name: string } };
  /** Called after any attempt so the page can reload the latest state from the server */
  onChanged: () => void;
  size?: 'sm' | 'md' | 'lg';
  /** Full-width stacked buttons (booking detail) instead of a row (cards) */
  stacked?: boolean;
}

/**
 * Buttons for the actions the SERVER says are allowed right now. Every status change goes
 * through a confirmation dialog first, and the server validates the change again.
 */
export default function BookingActions({ booking, onChanged, size = 'md', stacked = false }: Props) {
  const toast = useToast();
  const [pending, setPending] = useState<BookingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (booking.actions.length === 0) return null;

  const close = () => {
    setPending(null);
    setError(null);
  };

  const confirm = async () => {
    if (!pending) return;
    const config = ACTIONS[pending];
    setBusy(true);
    setError(null);
    try {
      if (config.status) {
        await api(`/bookings/${booking.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: config.status }) });
      } else {
        await api(`/bookings/${booking.id}/demo-payment`, { method: 'POST' });
      }
      toast.success(config.success);
      close();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      onChanged(); // the booking may have changed in the meantime — show its real state
    } finally {
      setBusy(false);
    }
  };

  const active = pending ? ACTIONS[pending] : null;
  const other = pending === 'cancel' ? booking.owner.name : booking.renter.name;

  return (
    <>
      <div className={`${styles.row} ${stacked ? styles.stacked : ''}`}>
        {booking.actions.map((action) => (
          <Button
            key={action}
            size={size}
            variant={ACTIONS[action].variant === 'danger' ? 'outline' : ACTIONS[action].variant}
            fullWidth={stacked}
            iconLeft={ICONS[action]}
            onClick={() => setPending(action)}
          >
            {ACTIONS[action].label}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={!!active}
        title={active?.confirmTitle ?? ''}
        description={active?.confirmBody(other)}
        confirmLabel={active?.confirmLabel ?? 'Confirm'}
        tone={pending === 'decline' || pending === 'cancel' ? 'danger' : pending === 'approve' ? 'primary' : 'accent'}
        loading={busy}
        error={error}
        onConfirm={confirm}
        onClose={close}
      />
    </>
  );
}
