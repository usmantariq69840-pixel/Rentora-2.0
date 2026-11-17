import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createReview } from '../services/reviews/reviewService.js';
import { reviewSchema } from '../validation/reviews.js';

const router = Router();

// POST /api/reviews — review a completed booking (participants only, one review each)
router.post('/', requireAuth, (req, res) => {
  const body = reviewSchema.parse(req.body);
  res.status(201).json({ review: createReview(req.user!, body) });
});

export default router;
