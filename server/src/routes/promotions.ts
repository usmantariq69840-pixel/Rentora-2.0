import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOwnerPromotions, listPlans, startPromotion, stopPromotion } from '../services/promotions/promotionService.js';
import { idParamSchema } from '../validation/items.js';
import { promoteSchema } from '../validation/promotions.js';

const router = Router();

// GET /api/promotions/plans — the simulated plans (public, so the comparison can be shown anywhere)
router.get('/plans', (_req, res) => {
  res.json({ plans: listPlans() });
});

router.use(requireAuth);

// GET /api/promotions/mine — my listings with their featured state, plus history
router.get('/mine', (req, res) => {
  res.json(getOwnerPromotions(req.user!.id));
});

// POST /api/promotions — start or extend a demo promotion on my own approved listing
router.post('/', (req, res) => {
  const { listingId, plan } = promoteSchema.parse(req.body);
  res.status(201).json(startPromotion(req.user!.id, listingId, plan));
});

// DELETE /api/promotions/:id — stop featuring one of my listings (:id is the listing id)
router.delete('/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  stopPromotion(req.user!.id, id);
  res.json({ ok: true });
});

export default router;
