import { db } from '../../database/connection.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { createNotification } from '../notifications/notificationService.js';
import type { AuthUser } from '../users/userService.js';

// ---------- overview ----------

export function getAdminOverview() {
  return db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM listings WHERE status = 'pending') AS pendingListings,
         (SELECT COUNT(*) FROM listings WHERE status = 'approved') AS liveListings,
         (SELECT COUNT(*) FROM listings WHERE status = 'hidden') AS hiddenListings,
         (SELECT COUNT(*) FROM reports WHERE status = 'open') AS openReports,
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM listings WHERE status = 'approved' AND featured_until > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) AS featuredListings`,
    )
    .get() as Record<string, number>;
}

// ---------- listings ----------

interface QueueRow {
  id: number;
  title: string;
  description: string;
  condition: string;
  daily_price: number;
  deposit_amount: number;
  location_text: string;
  specs: string;
  tags: string;
  availability_note: string | null;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
  updated_at: string;
  category_name: string;
  category_slug: string;
  subcategory: string | null;
  owner_id: number;
  owner_name: string;
  owner_email_verified: number;
  owner_phone_verified: number;
  open_reports: number;
}

const parseJson = <T,>(raw: string | null, fallback: T): T => {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

/** Listings for the moderation queue, with everything a moderator needs to decide. */
export function listListingsByStatus(status: 'pending' | 'approved' | 'hidden') {
  const rows = db
    .prepare(
      `SELECT l.id, l.title, l.description, l.item_condition AS condition, l.daily_price, l.deposit_amount, l.location_text, l.specs, l.tags,
              l.availability_note, l.status, l.created_at, l.updated_at, c.name AS category_name, c.slug AS category_slug, l.subcategory,
              u.id AS owner_id, u.name AS owner_name, u.email_verified_demo AS owner_email_verified, u.phone_verified_demo AS owner_phone_verified,
              (SELECT COUNT(*) FROM reports r WHERE r.listing_id = l.id AND r.status = 'open') AS open_reports
       FROM listings l JOIN categories c ON c.id = l.category_id JOIN users u ON u.id = l.owner_id
       WHERE l.status = ?
       ORDER BY l.created_at ${status === 'pending' ? 'ASC' : 'DESC'}, l.id`, // oldest pending first, so nothing waits forever
    )
    .all(status) as QueueRow[];

  const images = db.prepare('SELECT file_path FROM listing_images WHERE listing_id = ? ORDER BY is_cover DESC, sort_order, id');
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    condition: r.condition,
    dailyPrice: r.daily_price,
    depositAmount: r.deposit_amount,
    location: r.location_text,
    specs: parseJson<{ label: string; value: string }[]>(r.specs, []),
    tags: parseJson<string[]>(r.tags, []),
    availabilityNote: r.availability_note,
    status: r.status,
    categoryName: r.category_name,
    categorySlug: r.category_slug,
    subcategory: r.subcategory,
    createdAt: r.created_at,
    images: (images.all(r.id) as { file_path: string }[]).map((i) => `/uploads/${i.file_path}`),
    openReports: r.open_reports,
    owner: { id: r.owner_id, name: r.owner_name, emailVerifiedDemo: !!r.owner_email_verified, phoneVerifiedDemo: !!r.owner_phone_verified },
  }));
}

// ---------- users ----------

export function listUsers() {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.email_verified_demo AS ev, u.phone_verified_demo AS pv, u.created_at,
              (SELECT COUNT(*) FROM listings l WHERE l.owner_id = u.id AND l.status <> 'archived') AS listings,
              (SELECT COUNT(*) FROM bookings b WHERE b.renter_id = u.id) AS rentals_taken,
              (SELECT COUNT(*) FROM bookings b WHERE b.owner_id = u.id) AS rentals_given
       FROM users u ORDER BY u.role = 'admin' DESC, u.created_at, u.id`,
    )
    .all() as { id: number; name: string; email: string; role: string; ev: number; pv: number; created_at: string; listings: number; rentals_taken: number; rentals_given: number }[];
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as 'user' | 'admin',
    emailVerifiedDemo: !!u.ev,
    phoneVerifiedDemo: !!u.pv,
    memberSince: u.created_at,
    listings: u.listings,
    rentalsTaken: u.rentals_taken,
    rentalsGiven: u.rentals_given,
  }));
}

// ---------- reports ----------

export function listReports(status: 'open' | 'resolved' | 'all') {
  const rows = db
    .prepare(
      `SELECT r.id, r.reason, r.status, r.created_at, l.id AS listing_id, l.title AS listing_title, l.status AS listing_status,
              owner.name AS owner_name, reporter.name AS reporter_name
       FROM reports r
       JOIN listings l ON l.id = r.listing_id
       JOIN users owner ON owner.id = l.owner_id
       JOIN users reporter ON reporter.id = r.reporter_id
       ${status === 'all' ? '' : 'WHERE r.status = @status'}
       ORDER BY r.status = 'open' DESC, r.created_at DESC, r.id DESC`,
    )
    .all(status === 'all' ? {} : { status }) as {
    id: number; reason: string; status: 'open' | 'resolved'; created_at: string; listing_id: number; listing_title: string;
    listing_status: string; owner_name: string; reporter_name: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    reporterName: r.reporter_name,
    listing: { id: r.listing_id, title: r.listing_title, status: r.listing_status, ownerName: r.owner_name },
  }));
}

export function setReportStatus(reportId: number, status: 'open' | 'resolved') {
  const info = db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, reportId);
  if (info.changes === 0) throw new HttpError(404, 'This report could not be found.');
}

/** Any signed-in person can flag a live listing. One open report per person per listing. */
export function createReport(user: AuthUser, listingId: number, reason: string) {
  const listing = db.prepare('SELECT owner_id, title, status FROM listings WHERE id = ?').get(listingId) as
    | { owner_id: number; title: string; status: string }
    | undefined;
  if (!listing || listing.status !== 'approved') throw new HttpError(404, 'This listing could not be found.');
  if (listing.owner_id === user.id) throw new HttpError(403, 'You can’t report your own listing.');
  const dup = db.prepare("SELECT 1 FROM reports WHERE listing_id = ? AND reporter_id = ? AND status = 'open'").get(listingId, user.id);
  if (dup) throw new HttpError(409, 'You’ve already reported this listing. A moderator will look at it soon.');

  db.prepare('INSERT INTO reports (listing_id, reporter_id, reason) VALUES (?, ?, ?)').run(listingId, user.id, reason);
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
  for (const a of admins) createNotification(a.id, 'New listing report', `“${listing.title}” was reported by ${user.name}.`, '/admin?tab=reports');
}
