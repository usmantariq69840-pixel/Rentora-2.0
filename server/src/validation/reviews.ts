import { z } from 'zod';

export const reviewSchema = z.object({
  bookingId: z.number().int().positive(),
  rating: z.number().int('Choose a rating from 1 to 5').min(1, 'Choose a rating from 1 to 5').max(5, 'Choose a rating from 1 to 5'),
  comment: z
    .string()
    .trim()
    .max(600, 'Keep your review under 600 characters')
    .optional()
    .transform((v) => (v ? v : null)),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
