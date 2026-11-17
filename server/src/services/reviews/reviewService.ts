import { db } from '../../database/connection.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { ReviewInput } from '../../validation/reviews.js';
import { createNotification } from '../notifications/notificationService.js';
import type { AuthUser } from '../users/userService.js';

interface BookingForReview {
  id: number;
  status: string;
  renter_id: number;
  owner_id: number;
  listing_id: number;
  title: string;
}

interface ReviewRow {
  id: number;
  reviewer_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

const toReview = (r: ReviewRow) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at });

/**
 * Who has reviewed what for one booking. Both people can leave one review after the rental is completed:
 * the renter reviews the owner (this is what appears on the listing), the owner reviews the renter.
 */
export function reviewStateFor(user: AuthUser, booking: { id: number; status: string; renter_id: number; owner_id: number }) {
  const rows = db
    .prepare('SELECT id, reviewer_id, rating, comment, created_at FROM reviews WHERE booking_id = ?')
    .all(booking.id) as ReviewRow[];
  const mine = rows.find((r) => r.reviewer_id === user.id);
  const theirs = rows.find((r) => r.reviewer_id !== user.id);
  const participant = user.id === booking.renter_id || user.id === booking.owner_id;
  return {
    canReview: participant && booking.status === 'completed' && !mine,
    mine: mine ? toReview(mine) : null,
    theirs: theirs ? toReview(theirs) : null,
  };
}

export function createReview(user: AuthUser, input: ReviewInput) {
  const booking = db
    .prepare(
      `SELECT b.id, b.status, b.renter_id, b.owner_id, b.listing_id, l.title
       FROM bookings b JOIN listings l ON l.id = b.listing_id WHERE b.id = ?`,
    )
    .get(input.bookingId) as BookingForReview | undefined;

  // Same answer for "doesn't exist" and "isn't yours", so booking ids can't be probed.
  if (!booking || (booking.renter_id !== user.id && booking.owner_id !== user.id)) {
    throw new HttpError(404, 'This booking could not be found.');
  }
  if (booking.status !== 'completed') {
    throw new HttpError(409, 'You can leave a review once the rental has been marked as returned.');
  }
  const existing = db.prepare('SELECT 1 FROM reviews WHERE booking_id = ? AND reviewer_id = ?').get(booking.id, user.id);
  if (existing) throw new HttpError(409, 'You have already reviewed this rental.');

  const revieweeId = user.id === booking.renter_id ? booking.owner_id : booking.renter_id;
  const info = db
    .prepare('INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(booking.id, user.id, revieweeId, input.rating, input.comment, new Date().toISOString());

  createNotification(
    revieweeId,
    'You received a review',
    `${user.name} left you ${input.rating} star${input.rating === 1 ? '' : 's'} for “${booking.title}”.`,
    `/bookings/${booking.id}`,
  );
  return { id: Number(info.lastInsertRowid), listingId: booking.listing_id };
}
