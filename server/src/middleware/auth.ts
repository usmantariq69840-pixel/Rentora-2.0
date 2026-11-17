import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE, userIdForToken } from '../lib/session.js';
import { getUserById, type AuthUser } from '../services/users/userService.js';
import { HttpError } from './errorHandler.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by attachUser when the request carries a valid session cookie */
      user?: AuthUser;
    }
  }
}

/** Looks up the session cookie on every request. Guests simply have no `req.user`. */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === 'string' && token) {
    const userId = userIdForToken(token);
    const user = userId ? getUserById(userId) : null;
    if (user) req.user = user;
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue.'));
  next();
}

/** The backend enforces the admin role itself; hiding a link in React is not access control. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, 'Please sign in to continue.'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'This area is for the demo administrator only.'));
  next();
}
