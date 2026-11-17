import type { BookingAction, BookingStatus } from '../types';

/** Everything the UI needs to know about each booking action, in one place. */
export interface ActionConfig {
  label: string;
  /** Target status sent to PATCH /bookings/:id/status (the demo payment uses its own endpoint) */
  status?: Exclude<BookingStatus, 'pending'>;
  variant: 'primary' | 'accent' | 'outline' | 'danger';
  confirmTitle: string;
  confirmBody: (other: string) => string;
  confirmLabel: string;
  success: string;
}

export const ACTIONS: Record<BookingAction, ActionConfig> = {
  approve: {
    label: 'Approve',
    status: 'approved',
    variant: 'primary',
    confirmTitle: 'Approve this request?',
    confirmBody: (renter) => `${renter} will be notified and can then confirm the demo payment. These dates will be blocked for other renters.`,
    confirmLabel: 'Approve request',
    success: 'Request approved',
  },
  decline: {
    label: 'Decline',
    status: 'declined',
    variant: 'outline',
    confirmTitle: 'Decline this request?',
    confirmBody: (renter) => `${renter} will be told the request was declined. This can’t be undone.`,
    confirmLabel: 'Decline request',
    success: 'Request declined',
  },
  cancel: {
    label: 'Cancel request',
    status: 'cancelled',
    variant: 'outline',
    confirmTitle: 'Cancel your request?',
    confirmBody: (owner) => `${owner} will be told you cancelled. This can’t be undone, but you can send a new request any time.`,
    confirmLabel: 'Yes, cancel request',
    success: 'Request cancelled',
  },
  complete: {
    label: 'Mark as returned',
    status: 'completed',
    variant: 'accent',
    confirmTitle: 'Mark this rental as complete?',
    confirmBody: () => 'Use this once the item has been returned. In this demo you can do it at any time after approving.',
    confirmLabel: 'Mark complete',
    success: 'Rental marked complete',
  },
  pay: {
    label: 'Confirm demo payment',
    variant: 'accent',
    confirmTitle: 'Confirm the demo payment?',
    confirmBody: () => 'Demo payment only — no real money is charged and no card or bank details are collected.',
    confirmLabel: 'Confirm demo payment',
    success: 'Demo payment confirmed',
  },
};

/** Which tab/filter group a booking belongs to. */
export const isClosed = (s: BookingStatus) => s === 'declined' || s === 'cancelled';

/** Pending first (they need attention), then newest first. */
export function sortBookings<T extends { status: BookingStatus; createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const pa = a.status === 'pending' ? 0 : 1;
    const pb = b.status === 'pending' ? 0 : 1;
    return pa - pb || b.createdAt.localeCompare(a.createdAt);
  });
}
