import { Router, type Request } from 'express';
import { assertImages, imageUpload, MAX_IMAGES_PER_LISTING, saveImages } from '../lib/uploads.js';
import { createWindowLimiter } from '../lib/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { createReport } from '../services/admin/adminService.js';
import { getListingDetail, searchListings } from '../services/listings/listingService.js';
import { archiveListing, createListing, updateListing } from '../services/listings/listingWriteService.js';
import { idParamSchema, itemsQuerySchema } from '../validation/items.js';
import { reportCreateSchema } from '../validation/admin.js';
import { listingCreateSchema, listingUpdateSchema } from '../validation/listings.js';

const router = Router();
const reportLimiter = createWindowLimiter(8, 10 * 60_000, 'You’ve sent a lot of reports in a short time.');

// GET /api/items — search, filter, sort and paginate approved listings
router.get('/', (req, res) => {
  const query = itemsQuerySchema.parse(req.query);
  res.json(searchListings(query));
});

// GET /api/items/:id — full detail page data
router.get('/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  // Owners and admins can also open their own pending listings.
  const item = getListingDetail(id, req.user ? { id: req.user.id, role: req.user.role } : undefined);
  if (!item) throw new HttpError(404, 'This listing could not be found.');
  res.json({ item });
});

/** The wizard sends multipart/form-data: the text fields as JSON in `data`, the photos as `images`. */
function readMultipart(req: Request): { json: unknown; files: Express.Multer.File[] } {
  const raw = (req.body as Record<string, unknown> | undefined)?.data;
  let json: unknown;
  try {
    json = typeof raw === 'string' ? JSON.parse(raw) : undefined;
  } catch {
    throw new HttpError(400, 'The form could not be read. Please try again.');
  }
  if (typeof json !== 'object' || json === null) throw new HttpError(400, 'The form could not be read. Please try again.');
  return { json, files: Array.isArray(req.files) ? req.files : [] };
}

// POST /api/items — create a listing (starts as "pending" until an admin approves it)
router.post('/', requireAuth, imageUpload.array('images', MAX_IMAGES_PER_LISTING), (req, res) => {
  const { json, files } = readMultipart(req);
  const input = listingCreateSchema.parse(json);
  const detected = assertImages(files); // every file is checked before anything is written to disk
  const paths = saveImages(files, detected);
  const id = createListing(req.user!.id, input, paths, input.coverNewIndex);
  res.status(201).json({ id, status: 'pending' });
});

// PATCH /api/items/:id — edit your own listing (add/remove photos, change the cover)
router.patch('/:id', requireAuth, imageUpload.array('images', MAX_IMAGES_PER_LISTING), (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { json, files } = readMultipart(req);
  const { removeImageIds, coverImageId, coverNewIndex, ...input } = listingUpdateSchema.parse(json);
  const detected = assertImages(files);
  const paths = saveImages(files, detected);
  updateListing(id, req.user!.id, input, { removeImageIds, coverImageId, coverNewIndex }, paths);
  res.json({ id });
});

// POST /api/items/:id/archive — owners remove a listing from the site (booking history is kept)
router.post('/:id/archive', requireAuth, (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  archiveListing(id, req.user!.id);
  res.json({ ok: true });
});

// POST /api/items/:id/report — flag a live listing for a moderator
router.post('/:id/report', requireAuth, (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = reportCreateSchema.parse(req.body);
  reportLimiter.hit(String(req.user!.id));
  createReport(req.user!, id, reason);
  res.status(201).json({ ok: true });
});

export default router;
