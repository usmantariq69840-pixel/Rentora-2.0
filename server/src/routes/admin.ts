import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getAdminOverview, listListingsByStatus, listReports, listUsers, setReportStatus } from '../services/admin/adminService.js';
import { setListingReviewStatus } from '../services/listings/listingWriteService.js';
import { adminListingsQuery, moderationSchema, reportsQuery, reportStatusSchema } from '../validation/admin.js';
import { idParamSchema } from '../validation/items.js';

const router = Router();
router.use(requireAdmin); // the server enforces the role; the React guard is only a convenience

router.get('/overview', (_req, res) => {
  res.json({ overview: getAdminOverview() });
});

// GET /api/admin/listings?status=pending|approved|hidden — the moderation queue
router.get('/listings', (req, res) => {
  const { status } = adminListingsQuery.parse(req.query);
  res.json({ listings: listListingsByStatus(status) });
});

// PATCH /api/admin/listings/:id/status — approve or hide (an optional reason is sent to the owner)
router.patch('/listings/:id/status', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { status, reason } = moderationSchema.parse(req.body);
  setListingReviewStatus(id, status, reason);
  res.json({ ok: true, status });
});

router.get('/users', (_req, res) => {
  res.json({ users: listUsers() });
});

router.get('/reports', (req, res) => {
  const { status } = reportsQuery.parse(req.query);
  res.json({ reports: listReports(status) });
});

router.patch('/reports/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { status } = reportStatusSchema.parse(req.body);
  setReportStatus(id, status);
  res.json({ ok: true, status });
});

export default router;
