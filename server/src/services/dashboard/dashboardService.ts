import { db } from '../../database/connection.js';
import { todayISO } from '../../lib/dates.js';
import { listOwnerListings } from '../listings/listingService.js';

/** Every figure is calculated from the database on each request — nothing is hard-coded. */
export function getDashboard(userId: number) {
  const stats = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM listings WHERE owner_id = @u AND status <> 'archived') AS listings,
         (SELECT COUNT(*) FROM listings WHERE owner_id = @u AND status = 'approved') AS liveListings,
         (SELECT COUNT(*) FROM listings WHERE owner_id = @u AND status = 'pending') AS pendingListings,
         (SELECT COUNT(*) FROM bookings WHERE owner_id = @u AND status = 'pending') AS pendingRequests,
         (SELECT COUNT(*) FROM bookings WHERE owner_id = @u AND status = 'approved' AND end_date >= @today) AS upcomingRentals,
         (SELECT COUNT(*) FROM bookings WHERE owner_id = @u AND status = 'completed') AS completedRentals,
         (SELECT COALESCE(SUM(rental_total), 0) FROM bookings WHERE owner_id = @u AND status = 'completed') AS demoEarnings`,
    )
    .get({ u: userId, today: todayISO() }) as Record<string, number>;

  return { stats, listings: listOwnerListings(userId) };
}
