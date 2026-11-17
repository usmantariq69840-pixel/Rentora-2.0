import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { attachUser } from './middleware/auth.js';
import promotionsRouter from './routes/promotions.js';
import reviewsRouter from './routes/reviews.js';
import adminRouter from './routes/admin.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';
import categoriesRouter from './routes/categories.js';
import dashboardRouter from './routes/dashboard.js';
import favoritesRouter from './routes/favorites.js';
import healthRouter from './routes/health.js';
import itemsRouter from './routes/items.js';
import notificationsRouter from './routes/notifications.js';
import settingsRouter from './routes/settings.js';
import { uploadsRoot } from './lib/uploads.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(attachUser); // sets req.user when the session cookie is valid

  // Uploaded listing photos. File names are random and the type is checked on upload; nosniff keeps browsers from guessing.
  app.use(
    '/uploads',
    express.static(uploadsRoot, {
      maxAge: '7d',
      immutable: true,
      index: false,
      dotfiles: 'ignore',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  app.use('/api/health', healthRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/promotions', promotionsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
