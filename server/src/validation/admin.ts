import { z } from 'zod';

export const adminListingsQuery = z.object({
  status: z.enum(['pending', 'approved', 'hidden']).default('pending'),
});

export const moderationSchema = z.object({
  status: z.enum(['approved', 'hidden'], 'Choose approved or hidden'),
  /** Shown to the owner when a listing is hidden, so they know what to fix */
  reason: z.string().trim().max(300, 'Keep the reason under 300 characters').optional().transform((v) => (v ? v : null)),
});

export const reportStatusSchema = z.object({ status: z.enum(['open', 'resolved'], 'Choose open or resolved') });
export const reportsQuery = z.object({ status: z.enum(['open', 'resolved', 'all']).default('open') });

export const reportCreateSchema = z.object({
  reason: z.string().trim().min(10, 'Please give a little more detail (at least 10 characters)').max(400, 'Keep your report under 400 characters'),
});
