import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { listNotifications, markAllRead, markRead } from '../services/notifications/notificationService.js';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.coerce.number().int().positive() });

// GET /api/notifications — latest 30 plus the unread count for the bell badge
router.get('/', (req, res) => {
  res.json(listNotifications(req.user!.id));
});

// PATCH /api/notifications/read-all
router.patch('/read-all', (req, res) => {
  markAllRead(req.user!.id);
  res.json(listNotifications(req.user!.id));
});

// PATCH /api/notifications/:id/read — only your own notifications
router.patch('/:id/read', (req, res) => {
  const { id } = idParam.parse(req.params);
  if (!markRead(req.user!.id, id)) throw new HttpError(404, 'Notification not found.');
  res.json(listNotifications(req.user!.id));
});

export default router;
