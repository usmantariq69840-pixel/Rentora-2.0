import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { config } from '../config.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { createFailureLimiter } from '../lib/rateLimit.js';
import { endSession, SESSION_COOKIE, startSession } from '../lib/session.js';
import { createNotification } from '../services/notifications/notificationService.js';
import {
  createUser,
  demoAccountId,
  findCredentials,
  findUserIdByEmail,
  getUserById,
  updateProfile,
} from '../services/users/userService.js';
import { demoLoginSchema, loginSchema, profileSchema, registerSchema } from '../validation/auth.js';

const router = Router();
const limiter = createFailureLimiter(8, 10 * 60_000);

// Used so a wrong email takes about as long to reject as a wrong password (no account probing).
const DUMMY_HASH = hashPassword('rentora-not-a-real-password');

// POST /api/auth/register — local demo account creation
router.post('/register', (req, res) => {
  const body = registerSchema.parse(req.body);
  if (findUserIdByEmail(body.email)) {
    const message = 'An account with this email already exists. Try signing in instead.';
    throw new HttpError(409, message, [{ path: 'email', message }]);
  }
  const user = createUser(body);
  createNotification(user.id, 'Welcome to Rentora', 'Your demo account is ready. Browse rentals, save items and send your first booking request.', '/browse');
  startSession(res, user.id);
  res.status(201).json({ user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const key = `${req.ip}|${email}`;
  limiter.check(key);

  const credentials = findCredentials(email);
  const valid = verifyPassword(password, credentials?.passwordHash ?? DUMMY_HASH);
  if (!credentials || !valid) {
    limiter.fail(key);
    throw new HttpError(401, 'That email and password don’t match. Check them and try again.');
  }
  limiter.clear(key);
  startSession(res, credentials.id);
  res.json({ user: getUserById(credentials.id) });
});

// POST /api/auth/demo-login — one-click demo accounts (disabled in production builds)
router.post('/demo-login', (req, res) => {
  if (config.isProduction) throw new HttpError(404, 'Route not found');
  const { account } = demoLoginSchema.parse(req.body);
  const id = demoAccountId(account);
  if (!id) throw new HttpError(404, 'The demo account is missing. Run "npm run db:reset -w server" to restore it.');
  startSession(res, id);
  res.json({ user: getUserById(id) });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  endSession(res, typeof token === 'string' ? token : undefined);
  res.json({ ok: true });
});

// GET /api/auth/me — guests get { user: null } (not an error), so the page can decide what to show
router.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

// PATCH /api/auth/me — edit display name and phone
router.patch('/me', requireAuth, (req, res) => {
  const body = profileSchema.parse(req.body);
  res.json({ user: updateProfile(req.user!.id, body) });
});

export default router;
