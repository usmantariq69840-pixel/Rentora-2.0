import { z } from 'zod';

export const promoteSchema = z.object({
  listingId: z.number().int().positive(),
  plan: z.enum(['week', 'month'], 'Choose a featured plan'),
});
