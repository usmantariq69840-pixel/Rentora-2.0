import { db } from '../../database/connection.js';
import { formatRange, MAX_RENTAL_DAYS, rentalDays, todayISO } from '../../lib/dates.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { reviewStateFor } from '../reviews/reviewService.js';
import { createNotification } from '../notifications/notificationService.js';
import type { AuthUser } from '../users/userService.js';

export type BookingStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed';
/** What the signed-in viewer may do next. The server decides; the UI only shows what it is told. */
export type BookingAction = 'approve' | 'decline' | 'cancel' | 'complete' | 'pay';

/**
 * Allowed status changes. Nothing else is accepted, so a status can never be set arbitrarily.
 *   owner:  pending → approved | declined,  approved → completed
 *   renter: pending → cancelled
 */
const TRANSITIONS: Record<Exclude<BookingStatus, 'pending'>, { from: BookingStatus; by: 'owner' | 'renter' }> = {
  approved: { from: 'pending', by: 'owner' },
  declined: { from: 'pending', by: 'owner' },
  cancelled: { from: 'pending', by: 'renter' },
  completed: { from: 'approved', by: 'owner' },
};

const COVER_SQL = `(SELECT file_path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.is_cover DESC, li.sort_order, li.id LIMIT 1)`;

const SELECT_BOOKING = `
  SELECT b.id, b.listing_id, b.renter_id, b.owner_id, b.start_date, b.end_date, b.rental_days,
         b.daily_price_snapshot, b.rental_total, b.deposit_snapshot, b.status, b.demo_payment_status, b.created_at,
         l.title AS listing_title, l.subcategory, l.location_text, c.slug AS category_slug,
         ${COVER_SQL} AS cover,
         ru.name AS renter_name, ow.name AS owner_name,
         EXISTS (SELECT 1 FROM bookings x
                  WHERE x.listing_id = b.listing_id AND x.status = 'approved' AND x.id <> b.id
                    AND x.start_date <= b.end_date AND x.end_date >= b.start_date) AS has_conflict
  FROM bookings b
  JOIN listings l ON l.id = b.listing_id
  JOIN categories c ON c.id = l.category_id
  JOIN users ru ON ru.id = b.renter_id
  JOIN users ow ON ow.id = b.owner_id`;

interface BookingRow {
  id: number;
  listing_id: number;
  renter_id: number;
  owner_id: number;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_price_snapshot: number;
  rental_total: number;
  deposit_snapshot: number;
  status: BookingStatus;
  demo_payment_status: 'none' | 'confirmed';
  created_at: string;
  listing_title: string;
  subcategory: string | null;
  location_text: string;
  category_slug: string;
  cover: string | null;
  renter_name: string;
  owner_name: string;
  has_conflict: number;
}

function actionsFor(row: BookingRow, viewerId: number): BookingAction[] {
  const isOwner = row.owner_id === viewerId;
  const isRenter = row.renter_id === viewerId;
  const actions: BookingAction[] = [];
  if (row.status === 'pending') {
    if (isOwner && !row.has_conflict) actions.push('approve');
    if (isOwner) actions.push('decline');
    if (isRenter) actions.push('cancel');
  }
  if (row.status === 'approved') {
    if (isRenter && row.demo_payment_status === 'none') actions.push('pay');
    if (isOwner) actions.push('complete');
  }
  return actions;
}

function toBooking(row: BookingRow, viewerId: number) {
  return {
    id: row.id,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    rentalDays: row.rental_days,
    dailyPrice: row.daily_price_snapshot,
    rentalTotal: row.rental_total,
    deposit: row.deposit_snapshot,
    paymentStatus: row.demo_payment_status,
    createdAt: row.created_at,
    // A pending request that now overlaps an approved booking can no longer be approved.
    conflict: row.status === 'pending' && !!row.has_conflict,
    role: row.owner_id === viewerId ? ('owner' as const) : ('renter' as const),
    actions: actionsFor(row, viewerId),
    listing: {
      id: row.listing_id,
      title: row.listing_title,
      categorySlug: row.category_slug,
      subcategory: row.subcategory,
      location: row.location_text,
      imageUrl: row.cover ? `/uploads/${row.cover}` : undefined,
    },
    renter: { id: row.renter_id, name: row.renter_name },
    owner: { id: row.owner_id, name: row.owner_name },
  };
}

const getRow = (id: number) => db.prepare(`${SELECT_BOOKING} WHERE b.id = ?`).get(id) as BookingRow | undefined;

// ---------- reading ----------

export function listBookings(user: AuthUser, as: 'renter' | 'owner') {
  const column = as === 'renter' ? 'b.renter_id' : 'b.owner_id';
  const rows = db
    .prepare(`${SELECT_BOOKING} WHERE ${column} = ? ORDER BY b.created_at DESC, b.id DESC`)
    .all(user.id) as BookingRow[];
  return rows.map((r) => toBooking(r, user.id));
}

export function getBookingDetail(user: AuthUser, id: number) {
  const row = getRow(id);
  if (!row) throw new HttpError(404, 'This booking could not be found.');
  // Only the two people involved can open a booking.
  if (row.renter_id !== user.id && row.owner_id !== user.id) {
    throw new HttpError(403, 'You don’t have access to this booking.');
  }

  const history = db
    .prepare(
      `SELECT h.new_status AS status, h.created_at AS at, u.name AS by_name
       FROM booking_status_history h LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.booking_id = ? ORDER BY h.created_at, h.id`,
    )
    .all(id) as { status: BookingStatus; at: string; by_name: string | null }[];

  const person = db.prepare(
    'SELECT id, name, email_verified_demo AS ev, phone_verified_demo AS pv, created_at FROM users WHERE id = ?',
  );
  const describe = (userId: number) => {
    const p = person.get(userId) as { id: number; name: string; ev: number; pv: number; created_at: string };
    return { id: p.id, name: p.name, emailVerifiedDemo: !!p.ev, phoneVerifiedDemo: !!p.pv, memberSince: p.created_at };
  };

  return {
    ...toBooking(row, user.id),
    renter: describe(row.renter_id),
    owner: describe(row.owner_id),
    history: history.map((h) => ({ status: h.status, at: h.at, byName: h.by_name })),
    review: reviewStateFor(user, row),
  };
}

// ---------- creating ----------

export function createBooking(renter: AuthUser, input: { listingId: number; startDate: string; endDate: string }) {
  const { listingId, startDate, endDate } = input;

  if (startDate < todayISO()) {
    throw new HttpError(400, 'The start date can’t be in the past.', [{ path: 'startDate', message: 'Choose today or a later date.' }]);
  }
  if (endDate < startDate) {
    throw new HttpError(400, 'The end date can’t be before the start date.', [{ path: 'endDate', message: 'Choose a date on or after the start date.' }]);
  }
  const days = rentalDays(startDate, endDate);
  if (days > MAX_RENTAL_DAYS) {
    throw new HttpError(400, `Rentals can be at most ${MAX_RENTAL_DAYS} days. Please choose a shorter range.`);
  }

  // One transaction: the checks and the inserts see the same data, and a failure undoes everything.
  const create = db.transaction(() => {
    const listing = db
      .prepare('SELECT id, owner_id, title, daily_price, deposit_amount, status FROM listings WHERE id = ?')
      .get(listingId) as
      | { id: number; owner_id: number; title: string; daily_price: number; deposit_amount: number; status: string }
      | undefined;
    if (!listing || listing.status !== 'approved') throw new HttpError(404, 'This listing isn’t available to book.');
    if (listing.owner_id === renter.id) throw new HttpError(403, 'You can’t request your own listing.');

    const clash = db
      .prepare(
        `SELECT 1 FROM bookings WHERE listing_id = ? AND status = 'approved' AND start_date <= ? AND end_date >= ? LIMIT 1`,
      )
      .get(listingId, endDate, startDate);
    if (clash) throw new HttpError(409, 'Those dates overlap an approved booking. Please choose different dates.');

    const duplicate = db
      .prepare(
        `SELECT 1 FROM bookings WHERE listing_id = ? AND renter_id = ? AND status IN ('pending', 'approved')
           AND start_date <= ? AND end_date >= ? LIMIT 1`,
      )
      .get(listingId, renter.id, endDate, startDate);
    if (duplicate) throw new HttpError(409, 'You already have a request for these dates on this item.');

    const now = new Date().toISOString();
    const id = Number(
      db
        .prepare(
          `INSERT INTO bookings (listing_id, renter_id, owner_id, start_date, end_date, rental_days,
                                 daily_price_snapshot, rental_total, deposit_snapshot, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        )
        .run(listingId, renter.id, listing.owner_id, startDate, endDate, days, listing.daily_price, days * listing.daily_price, listing.deposit_amount, now)
        .lastInsertRowid,
    );
    db.prepare('INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, created_at) VALUES (?, NULL, ?, ?, ?)').run(id, 'pending', renter.id, now);
    createNotification(
      listing.owner_id,
      'New booking request',
      `${renter.name} requested ${listing.title} for ${formatRange(startDate, endDate)}.`,
      `/bookings/${id}`,
    );
    return id;
  });

  return getBookingDetail(renter, create());
}

// ---------- changing status ----------

const NOTE: Record<Exclude<BookingStatus, 'pending'>, (b: BookingRow, actor: AuthUser) => { to: number; title: string; body: string }> = {
  approved: (b, actor) => ({
    to: b.renter_id,
    title: 'Request approved',
    body: `${actor.name} approved your request for ${b.listing_title} (${formatRange(b.start_date, b.end_date)}). Confirm the demo payment to finish.`,
  }),
  declined: (b, actor) => ({
    to: b.renter_id,
    title: 'Request declined',
    body: `${actor.name} declined your request for ${b.listing_title} (${formatRange(b.start_date, b.end_date)}).`,
  }),
  cancelled: (b, actor) => ({
    to: b.owner_id,
    title: 'Request cancelled',
    body: `${actor.name} cancelled their request for ${b.listing_title} (${formatRange(b.start_date, b.end_date)}).`,
  }),
  completed: (b) => ({
    to: b.renter_id,
    title: 'Rental completed',
    body: `Your rental of ${b.listing_title} was marked complete. Thanks for renting with Rentora.`,
  }),
};

export function changeStatus(user: AuthUser, id: number, next: keyof typeof TRANSITIONS) {
  const rule = TRANSITIONS[next];

  const apply = db.transaction(() => {
    const row = getRow(id);
    if (!row) throw new HttpError(404, 'This booking could not be found.');
    if (row.renter_id !== user.id && row.owner_id !== user.id) {
      throw new HttpError(403, 'You don’t have access to this booking.');
    }

    const allowedActor = rule.by === 'owner' ? row.owner_id : row.renter_id;
    if (allowedActor !== user.id) {
      const who = rule.by === 'owner' ? 'the listing owner' : 'the renter who made the request';
      throw new HttpError(403, `Only ${who} can do this.`);
    }
    if (row.status !== rule.from) {
      throw new HttpError(409, `This booking is already ${row.status}, so it can’t be changed to ${next}.`);
    }
    // Approving needs a final overlap check against other approved bookings.
    if (next === 'approved' && row.has_conflict) {
      throw new HttpError(409, 'These dates now overlap another approved booking, so this request can’t be approved.');
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(next, id);
    db.prepare('INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?)').run(id, row.status, next, user.id, now);

    const note = NOTE[next](row, user);
    createNotification(note.to, note.title, note.body, `/bookings/${id}`);
  });
  apply();

  return getBookingDetail(user, id);
}

/** Demo payment: flips a flag on an approved booking. No card or bank details exist anywhere. */
export function confirmDemoPayment(user: AuthUser, id: number) {
  const apply = db.transaction(() => {
    const row = getRow(id);
    if (!row) throw new HttpError(404, 'This booking could not be found.');
    if (row.renter_id !== user.id) throw new HttpError(403, 'Only the renter can confirm the demo payment.');
    if (row.status !== 'approved') throw new HttpError(409, 'The demo payment can be confirmed once the owner approves the request.');
    if (row.demo_payment_status === 'confirmed') throw new HttpError(409, 'The demo payment is already confirmed.');

    db.prepare("UPDATE bookings SET demo_payment_status = 'confirmed' WHERE id = ?").run(id);
    createNotification(
      row.owner_id,
      'Demo payment confirmed',
      `${user.name} confirmed the demo payment for ${row.listing_title} (${formatRange(row.start_date, row.end_date)}).`,
      `/bookings/${id}`,
    );
  });
  apply();
  return getBookingDetail(user, id);
}
