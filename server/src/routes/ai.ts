import { Router } from 'express';
import { createWindowLimiter } from '../lib/rateLimit.js';
import { assertImages, imageUpload } from '../lib/uploads.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { createListingDraft } from '../services/ai/listingDraft.js';
import { searchByRequest } from '../services/ai/rentalSearch.js';
import { aiIsConfigured } from '../services/settings/settingsService.js';
import { draftRequestSchema, rentalSearchSchema } from '../validation/ai.js';

const router = Router();

// Protects the Gemini quota. Counted per signed-in user (drafts) or per address (search).
const draftLimiter = createWindowLimiter(15, 10 * 60_000, 'You’ve used a lot of AI drafts in a short time.');
const searchLimiter = createWindowLimiter(30, 10 * 60_000, 'You’ve made a lot of AI searches in a short time.');

// GET /api/ai/status — tells the UI whether to show "AI ready" or ask for a key. Never reveals the key.
router.get('/status', (req, res) => {
  res.json({ available: aiIsConfigured(), canConfigure: req.user?.role === 'admin' });
});

// POST /api/ai/listing-draft — multipart: optional `image` (JPEG/PNG/WebP, max 5 MB) + optional `notes`
router.post('/listing-draft', requireAuth, (req, _res, next) => { draftLimiter.hit(`u${req.user!.id}`); next(); }, imageUpload.single('image'), async (req, res) => {
  const { notes } = draftRequestSchema.parse(req.body ?? {});
  const file = req.file;
  if (!file && !notes) throw new HttpError(400, 'Add a photo or a few notes so the AI has something to work from.');

  let image: { mimeType: string; data: Buffer } | undefined;
  if (file) {
    const [detected] = assertImages([file]);
    image = { mimeType: detected.mime, data: file.buffer }; // held in memory only; never saved by this endpoint
  }
  res.json(await createListingDraft({ notes, image }));
});

// POST /api/ai/rental-search — public. The AI only reads the request; every result comes from the database.
router.post('/rental-search', (req, _res, next) => { searchLimiter.hit(req.user ? `u${req.user.id}` : `ip${req.ip}`); next(); }, async (req, res) => {
  const { query } = rentalSearchSchema.parse(req.body);
  res.json(await searchByRequest(query));
});

export default router;
