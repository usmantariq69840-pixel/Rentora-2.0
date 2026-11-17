/**
 * Rental date rules (identical to the server):
 *  - calendar days only ('YYYY-MM-DD')
 *  - INCLUSIVE counting: 25 Apr → 27 Apr is 3 rental days
 *  - end may equal start (1 day) but never come before it
 *  - bookings overlap when they share at least one calendar day
 */
const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function todayISO(): string {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parses 'YYYY-MM-DD' as a LOCAL date so it never shifts across time zones. */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function rentalDays(start: string, end: string): number {
  return dayNumber(end) - dayNumber(start) + 1;
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function formatDate(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatShort(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatLong(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMonthYear(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/** Cells for a Monday-first month grid: leading blanks, then every day as ISO. */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => toISO(year, month, i + 1)),
  ];
}

export const isIsoDate = (v: string | null | undefined): v is string =>
  !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseISO(v).getTime());

/** Longest single rental accepted by the demo (the server enforces the same limit). */
export const MAX_RENTAL_DAYS = 30;
