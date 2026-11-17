import { db } from '../../database/connection.js';
import { MAX_IMAGES_PER_LISTING, removeImageFiles } from '../../lib/uploads.js';
import { HttpError } from '../../middleware/errorHandler.js';
import type { ListingInput } from '../../validation/listings.js';
import { createNotification } from '../notifications/notificationService.js';

interface ImageRow { id: number; file_path: string; is_cover: number; sort_order: number }

const categoryId = (slug: string): number => {
  const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number } | undefined;
  if (!row) throw new HttpError(400, 'Choose a category.', [{ path: 'categorySlug', message: 'Choose a category' }]);
  return row.id;
};

/** Marks exactly one photo as the cover and numbers the rest in order. Cover first, then the order they were added. */
function applyCover(listingId: number, coverId: number | null) {
  const images = db.prepare('SELECT id FROM listing_images WHERE listing_id = ? ORDER BY sort_order, id').all(listingId) as { id: number }[];
  if (!images.length) return;
  const chosen = images.find((i) => i.id === coverId)?.id ?? images[0].id;
  const update = db.prepare('UPDATE listing_images SET is_cover = ?, sort_order = ? WHERE id = ?');
  images.forEach((img, index) => update.run(img.id === chosen ? 1 : 0, index, img.id));
}

function notifyAdmins(title: string, body: string, link: string) {
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
  for (const a of admins) createNotification(a.id, title, body, link);
}

export function createListing(ownerId: number, input: ListingInput, savedPaths: string[], coverNewIndex: number | null | undefined): number {
  try {
    return db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO listings (owner_id, category_id, title, subcategory, description, item_condition, daily_price,
                                 deposit_amount, location_text, specs, tags, availability_note, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        )
        .run(
          ownerId, categoryId(input.categorySlug), input.title, input.subcategory, input.description, input.condition,
          input.dailyPrice, input.depositAmount, input.location, JSON.stringify(input.specs), JSON.stringify(input.tags),
          input.availabilityNote,
        );
      const id = Number(result.lastInsertRowid);

      const insertImage = db.prepare('INSERT INTO listing_images (listing_id, file_path, is_cover, sort_order) VALUES (?, ?, 0, ?)');
      const imageIds = savedPaths.map((p, i) => Number(insertImage.run(id, p, i).lastInsertRowid));
      applyCover(id, imageIds[coverNewIndex ?? 0] ?? null);

      const owner = db.prepare('SELECT name FROM users WHERE id = ?').get(ownerId) as { name: string };
      notifyAdmins('New listing to review', `${owner.name} submitted “${input.title}” for approval.`, `/items/${id}`);
      return id;
    })();
  } catch (err) {
    removeImageFiles(savedPaths); // don't leave orphan files behind when the database write fails
    throw err;
  }
}

interface UpdateExtras {
  removeImageIds: number[];
  coverImageId?: number | null;
  coverNewIndex?: number | null;
}

/** Owners can edit their own listings only. An edit never changes the review status in this demo. */
export function updateListing(listingId: number, ownerId: number, input: ListingInput, extras: UpdateExtras, savedPaths: string[]) {
  const removedFiles: string[] = [];
  try {
    db.transaction(() => {
      const listing = db.prepare('SELECT owner_id, status FROM listings WHERE id = ?').get(listingId) as { owner_id: number; status: string } | undefined;
      if (!listing || listing.status === 'archived') throw new HttpError(404, 'This listing could not be found.');
      if (listing.owner_id !== ownerId) throw new HttpError(403, 'You can only edit your own listings.');

      const current = db.prepare('SELECT id, file_path, is_cover, sort_order FROM listing_images WHERE listing_id = ?').all(listingId) as ImageRow[];
      const removeIds = new Set(extras.removeImageIds.filter((id) => current.some((c) => c.id === id)));
      const remaining = current.length - removeIds.size;
      if (remaining + savedPaths.length > MAX_IMAGES_PER_LISTING) {
        throw new HttpError(400, `A listing can have up to ${MAX_IMAGES_PER_LISTING} photos.`);
      }

      db.prepare(
        `UPDATE listings SET category_id = ?, title = ?, subcategory = ?, description = ?, item_condition = ?, daily_price = ?,
                deposit_amount = ?, location_text = ?, specs = ?, tags = ?, availability_note = ?,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
      ).run(
        categoryId(input.categorySlug), input.title, input.subcategory, input.description, input.condition, input.dailyPrice,
        input.depositAmount, input.location, JSON.stringify(input.specs), JSON.stringify(input.tags), input.availabilityNote, listingId,
      );

      for (const img of current.filter((c) => removeIds.has(c.id))) {
        db.prepare('DELETE FROM listing_images WHERE id = ?').run(img.id);
        removedFiles.push(img.file_path);
      }
      const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM listing_images WHERE listing_id = ?').get(listingId) as { m: number }).m;
      const insertImage = db.prepare('INSERT INTO listing_images (listing_id, file_path, is_cover, sort_order) VALUES (?, ?, 0, ?)');
      const newIds = savedPaths.map((p, i) => Number(insertImage.run(listingId, p, maxOrder + 1 + i).lastInsertRowid));

      const existingCover = current.find((c) => c.is_cover && !removeIds.has(c.id))?.id ?? null;
      const cover = extras.coverNewIndex != null ? newIds[extras.coverNewIndex] ?? null : extras.coverImageId ?? existingCover;
      applyCover(listingId, cover);
    })();
  } catch (err) {
    removeImageFiles(savedPaths);
    throw err;
  }
  removeImageFiles(removedFiles); // delete files only after the database change succeeded
}

/** Soft-delete: the listing disappears everywhere but its booking history stays intact. */
export function archiveListing(listingId: number, ownerId: number) {
  const listing = db.prepare('SELECT owner_id, status FROM listings WHERE id = ?').get(listingId) as { owner_id: number; status: string } | undefined;
  if (!listing || listing.status === 'archived') throw new HttpError(404, 'This listing could not be found.');
  if (listing.owner_id !== ownerId) throw new HttpError(403, 'You can only archive your own listings.');
  const open = db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE listing_id = ? AND status IN ('pending', 'approved')").get(listingId) as { n: number };
  if (open.n > 0) {
    throw new HttpError(409, 'This listing still has open booking requests or approved rentals. Respond to them or mark them returned first.');
  }
  db.prepare("UPDATE listings SET status = 'archived', featured_until = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(listingId);
}

/** Admin review decision. The full moderation queue (Batch 5) reuses this. */
export function setListingReviewStatus(listingId: number, status: 'approved' | 'hidden', reason: string | null = null) {
  const listing = db.prepare('SELECT owner_id, title, status FROM listings WHERE id = ?').get(listingId) as
    | { owner_id: number; title: string; status: string }
    | undefined;
  if (!listing || listing.status === 'archived') throw new HttpError(404, 'This listing could not be found.');
  if (listing.status === status) return;
  // A hidden listing can't stay featured.
  db.prepare("UPDATE listings SET status = ?, featured_until = CASE WHEN ? = 'hidden' THEN NULL ELSE featured_until END, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(status, status, listingId);
  createNotification(
    listing.owner_id,
    status === 'approved' ? 'Your listing is live' : 'Your listing was hidden',
    status === 'approved'
      ? `“${listing.title}” was approved and now appears in search.`
      : `“${listing.title}” was hidden by a moderator.${reason ? ` Reason: ${reason}` : ''} Edit it and ask for another review.`,
    `/items/${listingId}`,
  );
}
