import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../services/dashboard/dashboardService.js';

const router = Router();

// GET /api/dashboard — owner overview figures and "my listings"
router.get('/', requireAuth, (req, res) => {
  res.json(getDashboard(req.user!.id));
});

export default router;
