import { z } from 'zod';
import { isIsoDate } from '../lib/dates.js';
import { categorySlugs } from './items.js';

export const draftRequestSchema = z.object({
  notes: z.string().trim().max(1000, 'Keep your notes under 1,000 characters').optional(),
});

export const apiKeySchema = z
  .string('Paste your Gemini API key')
  .trim()
  .regex(/^[A-Za-z0-9_-]{20,200}$/, 'That doesn’t look like a Gemini API key. A key is one long string of letters, numbers, - and _ with no spaces.');

export const aiSettingsSchema = z
  .object({
    apiKey: apiKeySchema.optional(),
    model: z
      .string()
      .trim()
      .transform((v) => v.replace(/^models\//, ''))
      .pipe(z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,59}$/, 'Use a model name like gemini-flash-latest'))
      .optional(),
  })
  .refine((v) => v.apiKey !== undefined || v.model !== undefined, { message: 'Nothing to save.' });

export const rentalSearchSchema = z.object({
  query: z.string('Describe what you want to rent').trim().min(3, 'Describe what you want to rent in a few words').max(500, 'Keep your request under 500 characters'),
});

/** What the AI (or the basic local reader) understood from a renter's request. */
export const criteriaSchema = z.object({
  categorySlug: z.enum(categorySlugs).nullish().transform((v) => v ?? null),
  subcategory: z.string().trim().max(40).nullish().transform((v) => v || null),
  keywords: z.array(z.string().trim().toLowerCase().min(2).max(30)).max(8).nullish().transform((v) => v ?? []),
  minDailyPrice: z.number().int().min(0).max(1_000_000).nullish().transform((v) => v ?? null),
  maxDailyPrice: z.number().int().min(0).max(1_000_000).nullish().transform((v) => v ?? null),
  days: z.number().int().min(1).max(60).nullish().transform((v) => v ?? null),
  startDate: z.string().refine(isIsoDate).nullish().transform((v) => v ?? null),
  endDate: z.string().refine(isIsoDate).nullish().transform((v) => v ?? null),
});
export type Criteria = z.infer<typeof criteriaSchema>;
