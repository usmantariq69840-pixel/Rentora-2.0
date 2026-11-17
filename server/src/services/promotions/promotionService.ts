import { db } from '../../database/connection.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { createNotification } from '../notifications/notificationService.js';

/** Simulated plans. Nothing is charged: "price" is only shown so the comparison looks realistic. */
export const PLANS = {
  week: { id: 'week', name: 'Featured · 7 days (demo)', days: 7, demoPrice: 499 },
  month: { id: 'month', name: 'Featured · 30 days (demo)', days: 30, demoPrice: 1499 },
} as const;
export type PlanId = keyof typeof PLANS;

const DAY = 86_400_000;

export function listPlans() {
  return Object.values(PLANS);
}

function ownedApproved(listingId: number, ownerId: number) {
  const l = db.prepare('SELECT owner_id, title, status, featured_until FROM listings WHERE id = ?').get(listingId) as
    | { owner_id: number; title: string; status: string; featured_until: string | null }
    | undefined;
  if (!l || l.status === 'archived') throw new HttpError(404, 'This listing could not be found.');
  if (l.owner_id !== ownerId) throw new HttpError(403, 'You can only promote your own listings.');
  return l;
}

/** Turn on (or extend) a demo promotion. Extending adds days after the current end date. */
export function startPromotion(ownerId: number, listingId: number, plan: PlanId) {
  const l = ownedApproved(listingId, ownerId);
  if (l.status !== 'approved') throw new HttpError(409, 'Only approved listings can be featured. This one is still waiting for review.');
  const chosen = PLANS[plan];
  const now = Date.now();
  const currentEnd = l.featured_until ? Date.parse(l.featured_until) : 0;
  const start = currentEnd > now ? currentEnd : now;
  const end = new Date(start + chosen.days * DAY).toISOString();

  db.transaction(() => {
    db.prepare("UPDATE listings SET featured_until = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(end, listingId);
    db.prepare("INSERT INTO demo_promotions (listing_id, plan_name, start_at, end_at, status) VALUES (?, ?, ?, ?, 'active')").run(
      listingId, chosen.name, new Date(start).toISOString(), end,
    );
  })();
  createNotification(ownerId, 'Featured (demo) is on', `“${l.title}” is featured until ${end.slice(0, 10)}. This is a simulation; nothing was charged.`, `/items/${listingId}`);
  return { featuredUntil: end };
}

export function stopPromotion(ownerId: number, listingId: number) {
  ownedApproved(listingId, ownerId);
  db.transaction(() => {
    db.prepare('UPDATE listings SET featured_until = NULL WHERE id = ?').run(listingId);
    db.prepare("UPDATE demo_promotions SET status = 'cancelled', end_at = ? WHERE listing_id = ? AND status = 'active' AND end_at > ?").run(
      new Date().toISOString(), listingId, new Date().toISOString(),
    );
  })();
}

/** The owner's listings with their promotion state, plus a history of past promotions. */
export function getOwnerPromotions(ownerId: number) {
  const now = new Date().toISOString();
  const listings = db
    .prepare(
      `SELECT l.id, l.title, l.status, l.featured_until,
              (SELECT file_path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.is_cover DESC, li.sort_order, li.id LIMIT 1) AS cover,
              l.category_id, (SELECT slug FROM categories c WHERE c.id = l.category_id) AS category_slug, l.subcategory
       FROM listings l WHERE l.owner_id = ? AND l.status <> 'archived' ORDER BY l.created_at DESC, l.id DESC`,
    )
    .all(ownerId) as { id: number; title: string; status: string; featured_until: string | null; cover: string | null; category_slug: string; subcategory: string | null }[];

  const history = db
    .prepare(
      `SELECT p.id, p.plan_name, p.start_at, p.end_at, p.status, l.id AS listing_id, l.title
       FROM demo_promotions p JOIN listings l ON l.id = p.listing_id
       WHERE l.owner_id = ? ORDER BY p.start_at DESC, p.id DESC LIMIT 20`,
    )
    .all(ownerId) as { id: number; plan_name: string; start_at: string; end_at: string; status: string; listing_id: number; title: string }[];

  return {
    plans: listPlans(),
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      status: l.status as 'pending' | 'approved' | 'hidden',
      categorySlug: l.category_slug,
      subcategory: l.subcategory,
      imageUrl: l.cover ? `/uploads/${l.cover}` : undefined,
      featured: !!l.featured_until && l.featured_until > now,
      featuredUntil: l.featured_until && l.featured_until > now ? l.featured_until : null,
    })),
    history: history.map((h) => ({
      id: h.id,
      planName: h.plan_name,
      startAt: h.start_at,
      endAt: h.end_at,
      // "active" rows whose end date has passed are shown as expired without needing a background job.
      status: h.status === 'active' && h.end_at <= now ? ('expired' as const) : (h.status as 'active' | 'expired' | 'cancelled'),
      listingId: h.listing_id,
      listingTitle: h.title,
    })),
  };
}
