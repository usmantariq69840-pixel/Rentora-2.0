import { db } from '../../database/connection.js';
import { todayISO } from '../../lib/dates.js';
import type { ItemsQuery } from '../../validation/items.js';

// ---------- shared SQL ----------

const RATING_SQL = `
  (SELECT ROUND(AVG(r.rating), 1) FROM reviews r JOIN bookings b ON b.id = r.booking_id
     WHERE b.listing_id = l.id AND r.reviewee_id = l.owner_id)`;
const REVIEW_COUNT_SQL = `
  (SELECT COUNT(*) FROM reviews r JOIN bookings b ON b.id = r.booking_id
     WHERE b.listing_id = l.id AND r.reviewee_id = l.owner_id)`;
const COVER_SQL = `
  (SELECT file_path FROM listing_images li WHERE li.listing_id = l.id ORDER BY li.is_cover DESC, li.sort_order, li.id LIMIT 1)`;

const SELECT_LISTING = `
  SELECT l.id, l.title, l.subcategory, l.description, l.item_condition, l.daily_price, l.deposit_amount,
         l.location_text, l.status, l.featured_until, l.created_at, l.owner_id, l.tags, l.availability_note,
         c.slug AS category_slug, c.name AS category_name, u.name AS owner_name,
         ${RATING_SQL} AS rating, ${REVIEW_COUNT_SQL} AS review_count, ${COVER_SQL} AS cover
  FROM listings l
  JOIN categories c ON c.id = l.category_id
  JOIN users u ON u.id = l.owner_id`;

interface ListingRow {
  id: number;
  title: string;
  subcategory: string | null;
  description: string;
  item_condition: string;
  daily_price: number;
  deposit_amount: number;
  location_text: string;
  status: string;
  featured_until: string | null;
  created_at: string;
  owner_id: number;
  tags: string;
  availability_note: string | null;
  category_slug: string;
  category_name: string;
  owner_name: string;
  rating: number | null;
  review_count: number;
  cover: string | null;
}

function parseTags(raw: string): string[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

const isFeatured = (row: ListingRow) => !!row.featured_until && row.featured_until > new Date().toISOString();
const imageUrl = (filePath: string) => `/uploads/${filePath}`;

function toListing(row: ListingRow) {
  return {
    id: row.id,
    title: row.title,
    subcategory: row.subcategory,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    dailyPrice: row.daily_price,
    depositAmount: row.deposit_amount,
    condition: row.item_condition,
    location: row.location_text,
    rating: row.rating,
    reviewCount: row.review_count,
    featured: isFeatured(row),
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    imageUrl: row.cover ? imageUrl(row.cover) : undefined,
  };
}

/** Escape LIKE wildcards so a search for "100%" is literal. */
const like = (term: string) => `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

// ---------- search / browse ----------

export function searchListings(query: ItemsQuery) {
  const where: string[] = ["l.status = 'approved'"];
  const params: Record<string, string | number> = { now: new Date().toISOString() };

  // Every word must match somewhere (title, description, subcategory, category or area).
  (query.q ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .forEach((term, i) => {
      params[`t${i}`] = like(term);
      where.push(
        `(l.title LIKE @t${i} ESCAPE '\\' OR l.description LIKE @t${i} ESCAPE '\\' OR l.subcategory LIKE @t${i} ESCAPE '\\'
          OR c.name LIKE @t${i} ESCAPE '\\' OR l.location_text LIKE @t${i} ESCAPE '\\' OR l.tags LIKE @t${i} ESCAPE '\\')`,
      );
    });

  if (query.category) { where.push('c.slug = @category'); params.category = query.category; }
  if (query.subcategory) { where.push('l.subcategory = @subcategory COLLATE NOCASE'); params.subcategory = query.subcategory; }
  if (query.minPrice !== undefined) { where.push('l.daily_price >= @minPrice'); params.minPrice = query.minPrice; }
  if (query.maxPrice !== undefined) { where.push('l.daily_price <= @maxPrice'); params.maxPrice = query.maxPrice; }
  if (query.featured) where.push('l.featured_until IS NOT NULL AND l.featured_until > @now');
  if (query.exclude) { where.push('l.id != @exclude'); params.exclude = query.exclude; }
  if (query.from && query.to) {
    // hide items that already have an APPROVED booking sharing a day with the requested range
    where.push(`NOT EXISTS (SELECT 1 FROM bookings b WHERE b.listing_id = l.id AND b.status = 'approved'
                              AND b.start_date <= @to AND b.end_date >= @from)`);
    params.from = query.from;
    params.to = query.to;
  }

  const featuredFirst = 'CASE WHEN l.featured_until IS NOT NULL AND l.featured_until > @now THEN 1 ELSE 0 END DESC';
  const order = {
    recommended: `${featuredFirst}, rating IS NULL, rating DESC, review_count DESC, l.id`,
    rating: 'rating IS NULL, rating DESC, review_count DESC, l.id',
    price_asc: 'l.daily_price ASC, l.id',
    price_desc: 'l.daily_price DESC, l.id',
  }[query.sort];

  const whereSql = where.join(' AND ');
  const total = (
    db
      .prepare(`SELECT COUNT(*) AS n FROM listings l JOIN categories c ON c.id = l.category_id WHERE ${whereSql}`)
      .get(params) as { n: number }
  ).n;

  const rows = db
    .prepare(`${SELECT_LISTING} WHERE ${whereSql} ORDER BY ${order} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: query.limit, offset: query.offset }) as ListingRow[];

  return { items: rows.map(toListing), total, limit: query.limit, offset: query.offset };
}

// ---------- detail ----------

export interface Viewer { id: number; role: 'user' | 'admin' }

export function getListingDetail(id: number, viewer?: Viewer) {
  const row = db.prepare(`${SELECT_LISTING} WHERE l.id = ?`).get(id) as ListingRow | undefined;
  if (!row || row.status === 'archived') return null; // archived listings are gone for everyone

  // Unapproved listings are visible only to their owner and to admins.
  const canSeePrivate = !!viewer && (viewer.role === 'admin' || viewer.id === row.owner_id);
  if (row.status !== 'approved' && !canSeePrivate) return null;

  const specsRow = db.prepare('SELECT specs FROM listings WHERE id = ?').get(id) as { specs: string };
  let specs: { label: string; value: string }[] = [];
  try { specs = JSON.parse(specsRow.specs); } catch { /* keep empty */ }

  const images = (
    db.prepare('SELECT id, file_path, is_cover FROM listing_images WHERE listing_id = ? ORDER BY is_cover DESC, sort_order, id').all(id) as
      { id: number; file_path: string; is_cover: number }[]
  ).map((i) => ({ id: i.id, url: imageUrl(i.file_path), isCover: !!i.is_cover }));

  const owner = db
    .prepare(
      `SELECT u.id, u.name, u.email_verified_demo AS ev, u.phone_verified_demo AS pv, u.created_at,
              (SELECT COUNT(*) FROM listings x WHERE x.owner_id = u.id AND x.status = 'approved') AS listing_count
       FROM users u WHERE u.id = ?`,
    )
    .get(row.owner_id) as { id: number; name: string; ev: number; pv: number; created_at: string; listing_count: number };

  const reviews = db
    .prepare(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
       FROM reviews r JOIN bookings b ON b.id = r.booking_id JOIN users u ON u.id = r.reviewer_id
       WHERE b.listing_id = ? AND r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT 12`,
    )
    .all(id, row.owner_id) as { id: number; rating: number; comment: string | null; created_at: string; reviewer_name: string }[];

  const distribution = db
    .prepare(
      `SELECT r.rating, COUNT(*) AS n FROM reviews r JOIN bookings b ON b.id = r.booking_id
       WHERE b.listing_id = ? AND r.reviewee_id = ? GROUP BY r.rating`,
    )
    .all(id, row.owner_id) as { rating: number; n: number }[];

  // Days that already have an approved booking — the calendar greys these out.
  const unavailable = db
    .prepare(
      `SELECT start_date AS start, end_date AS end FROM bookings
       WHERE listing_id = ? AND status = 'approved' AND end_date >= ? ORDER BY start_date`,
    )
    .all(id, todayISO()) as { start: string; end: string }[];

  return {
    ...toListing(row),
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    availabilityNote: row.availability_note,
    tags: parseTags(row.tags),
    specs,
    images,
    owner: {
      id: owner.id,
      name: owner.name,
      emailVerifiedDemo: !!owner.ev,
      phoneVerifiedDemo: !!owner.pv,
      memberSince: owner.created_at,
      listingCount: owner.listing_count,
    },
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, reviewerName: r.reviewer_name })),
    ratingBreakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: distribution.find((d) => d.rating === stars)?.n ?? 0 })),
    unavailable,
  };
}

// ---------- categories ----------

export function listCategories() {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.description,
              (SELECT COUNT(*) FROM listings l WHERE l.category_id = c.id AND l.status = 'approved') AS item_count
       FROM categories c ORDER BY c.id`,
    )
    .all() as { id: number; name: string; slug: string; description: string; item_count: number }[];
  return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, itemCount: c.item_count }));
}

export function getCategory(slug: string) {
  const category = listCategories().find((c) => c.slug === slug);
  if (!category) return null;
  const subcategories = db
    .prepare(
      `SELECT l.subcategory AS name, COUNT(*) AS count FROM listings l
       WHERE l.category_id = ? AND l.status = 'approved' AND l.subcategory IS NOT NULL
       GROUP BY l.subcategory ORDER BY count DESC, name`,
    )
    .all(category.id) as { name: string; count: number }[];
  return { ...category, subcategories };
}


// ---------- favourites and owner dashboard ----------

/** Approved listings the user has saved, newest save first. */
export function listFavoriteListings(userId: number) {
  const rows = db
    .prepare(
      `${SELECT_LISTING}
       JOIN favorites f ON f.listing_id = l.id
       WHERE f.user_id = ? AND l.status = 'approved'
       ORDER BY f.created_at DESC, f.id DESC`,
    )
    .all(userId) as ListingRow[];
  return rows.map(toListing);
}

export function isListingApproved(id: number): boolean {
  return !!db.prepare("SELECT 1 FROM listings WHERE id = ? AND status = 'approved'").get(id);
}

/** Every listing an owner has (except archived), with its status and booking count. */
export function listOwnerListings(ownerId: number) {
  const rows = db
    .prepare(
      `${SELECT_LISTING}
       WHERE l.owner_id = ? AND l.status <> 'archived'
       ORDER BY l.created_at DESC, l.id DESC`,
    )
    .all(ownerId) as ListingRow[];
  const counts = db
    .prepare(
      `SELECT listing_id, COUNT(*) AS n FROM bookings WHERE owner_id = ? AND status IN ('approved', 'completed') GROUP BY listing_id`,
    )
    .all(ownerId) as { listing_id: number; n: number }[];
  const byListing = new Map(counts.map((c) => [c.listing_id, c.n]));
  return rows.map((r) => ({
    ...toListing(r),
    status: r.status as 'pending' | 'approved' | 'hidden' | 'archived',
    createdAt: r.created_at,
    featuredUntil: isFeatured(r) ? r.featured_until : null,
    bookingCount: byListing.get(r.id) ?? 0,
  }));
}


// ---------- AI Rental Finder: matching real listings ----------

export interface MatchCriteria {
  categorySlug: string | null;
  subcategory: string | null;
  keywords: string[];
  minDailyPrice: number | null;
  maxDailyPrice: number | null;
  startDate: string | null;
  endDate: string | null;
}

/** Plural-insensitive word match: "cameras" finds "camera" and the other way round. */
const stem = (w: string) => w.toLowerCase().replace(/(?:es|s)$/, '');
const includesWord = (haystack: string, word: string) => haystack.toLowerCase().includes(stem(word));

/**
 * Real approved listings that fit the request. Category, budget and dates are hard rules;
 * keywords only rank (and, with no category, decide what is relevant at all).
 * Nothing here comes from the AI except the criteria it was asked to extract.
 */
export function findMatchingListings(c: MatchCriteria, limit = 9) {
  const where: string[] = ["l.status = 'approved'"];
  const params: Record<string, string | number> = {};
  if (c.categorySlug) { where.push('c.slug = @category'); params.category = c.categorySlug; }
  if (c.subcategory) { where.push('l.subcategory = @subcategory COLLATE NOCASE'); params.subcategory = c.subcategory; }
  if (c.minDailyPrice !== null) { where.push('l.daily_price >= @minPrice'); params.minPrice = c.minDailyPrice; }
  if (c.maxDailyPrice !== null) { where.push('l.daily_price <= @maxPrice'); params.maxPrice = c.maxDailyPrice; }
  if (c.startDate && c.endDate) {
    where.push(`NOT EXISTS (SELECT 1 FROM bookings b WHERE b.listing_id = l.id AND b.status = 'approved'
                              AND b.start_date <= @to AND b.end_date >= @from)`);
    params.from = c.startDate;
    params.to = c.endDate;
  }

  const rows = db
    .prepare(`${SELECT_LISTING} WHERE ${where.join(' AND ')} LIMIT 200`)
    .all(params) as ListingRow[];

  const scored = rows
    .map((row) => {
      const tags = parseTags(row.tags).join(' ');
      let score = 0;
      const matched: string[] = [];
      for (const word of c.keywords) {
        let hit = 0;
        if (includesWord(row.title, word)) hit = 4;
        else if (row.subcategory && includesWord(row.subcategory, word)) hit = 3;
        else if (includesWord(tags, word)) hit = 3;
        else if (includesWord(row.category_name, word)) hit = 1.5;
        else if (includesWord(row.description, word) || includesWord(row.location_text, word)) hit = 1;
        if (hit) { score += hit; if (hit >= 3) matched.push(word); }
      }
      return { row, score, matched };
    })
    // With a category, every listing in it is relevant; without one, a listing must match a keyword.
    .filter((m) => (c.categorySlug ? true : m.score > 0));

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.row.rating ?? 0) - (a.row.rating ?? 0) ||
      b.row.review_count - a.row.review_count ||
      a.row.daily_price - b.row.daily_price ||
      a.row.id - b.row.id,
  );

  return {
    total: scored.length,
    results: scored.slice(0, limit).map((m) => ({ listing: toListing(m.row), score: m.score, matchedKeywords: m.matched })),
  };
}

/** Plain facts for the "nothing matched" screen, read from the database (never invented). */
export function describeCloseOptions(c: MatchCriteria) {
  const hints: string[] = [];
  const base = { ...c };

  if (c.maxDailyPrice !== null) {
    const cheapest = findMatchingListings({ ...base, maxDailyPrice: null, minDailyPrice: null }, 50).results
      .map((r) => r.listing.dailyPrice)
      .sort((a, b) => a - b)[0];
    if (cheapest !== undefined && cheapest > c.maxDailyPrice) {
      hints.push(`The cheapest matching item costs Rs. ${cheapest.toLocaleString('en-PK')} per day, so try raising your budget.`);
    }
  }
  if (c.startDate && c.endDate) {
    const anyDates = findMatchingListings({ ...base, startDate: null, endDate: null }, 50).total;
    if (anyDates > 0) hints.push(`${anyDates} matching ${anyDates === 1 ? 'item is' : 'items are'} already booked on those dates. Try other dates.`);
  }
  if (c.categorySlug && c.keywords.length) {
    hints.push('Try fewer details, or browse the whole category.');
  }
  if (!c.categorySlug && !c.keywords.length) {
    hints.push('Say what kind of item you need, for example a camera, a PlayStation, a bike or a projector.');
  }
  if (!c.categorySlug && c.keywords.length) {
    hints.push('Nothing on Rentora matches those words yet. Try different words, or browse the categories.');
  }
  return hints;
}
