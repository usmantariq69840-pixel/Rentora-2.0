/**
 * Rental date rules — one consistent rule used everywhere:
 *  - dates are calendar days ('YYYY-MM-DD'), no times
 *  - the rental is INCLUSIVE of both days: 25 Apr → 27 Apr = 3 rental days
 *  - the end date may equal the start date (a one-day rental) but never precede it
 *  - two bookings overlap when they share at least one calendar day
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function dayNumber(iso: string): number {
  return Math.round(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);
}

export function rentalDays(start: string, end: string): number {
  return dayNumber(end) - dayNumber(start) + 1;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

/** Today's calendar date in the server's local time zone. */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Longest single rental accepted by the demo. */
export const MAX_RENTAL_DAYS = 30;

const shortDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fullDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** '25 Apr – 27 Apr 2026', or '25 Apr 2026' for a one-day rental. Used in notification text. */
export function formatRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  return start === end ? fullDay.format(s) : `${shortDay.format(s)} – ${fullDay.format(e)}`;
}
