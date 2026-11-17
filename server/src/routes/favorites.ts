import { Router } from 'express';
import { z } from 'zod';
import { db } from '../database/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { isListingApproved, listFavoriteListings } from '../services/listings/listingService.js';

const router = Router();
router.use(requireAuth);

const listingParam = z.object({ listingId: z.coerce.number().int().positive() });

// GET /api/favorites — saved listings (full cards) plus the id list the heart buttons use
router.get('/', (req, res) => {
  const items = listFavoriteListings(req.user!.id);
  res.json({ items, ids: items.map((i) => i.id) });
});

// POST /api/favorites/:listingId — saving twice is harmless
router.post('/:listingId', (req, res) => {
  const { listingId } = listingParam.parse(req.params);
  if (!isListingApproved(listingId)) throw new HttpError(404, 'This listing isn’t available to save.');
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, listing_id) VALUES (?, ?)').run(req.user!.id, listingId);
  res.status(201).json({ saved: true });
});

// DELETE /api/favorites/:listingId
router.delete('/:listingId', (req, res) => {
  const { listingId } = listingParam.parse(req.params);
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?').run(req.user!.id, listingId);
  res.json({ saved: false });
});

export default router;
