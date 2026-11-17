import { z } from 'zod';
import { isIsoDate } from '../lib/dates.js';

export const categorySlugs = [
  'cameras-photography',
  'gaming-consoles',
  'bikes-cycles',
  'electronics-equipment',
  'furniture-appliances',
  'watches-accessories',
  'vehicles',
] as const;

const isoDate = z.string().refine(isIsoDate, 'Use the format YYYY-MM-DD');

/** Query string for GET /api/items — validated on the server even though the UI also checks. */
export const itemsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: z.enum(categorySlugs).optional(),
    subcategory: z.string().trim().max(60).optional(),
    minPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
    maxPrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
    sort: z.enum(['recommended', 'price_asc', 'price_desc', 'rating']).default('recommended'),
    featured: z.enum(['1', 'true']).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    exclude: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(48).default(12),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    message: 'Minimum price cannot be higher than maximum price',
    path: ['minPrice'],
  })
  .refine((v) => !v.from === !v.to, { message: 'Provide both from and to dates', path: ['to'] })
  .refine((v) => !v.from || !v.to || v.from <= v.to, { message: 'End date cannot be before start date', path: ['to'] });

export type ItemsQuery = z.infer<typeof itemsQuerySchema>;

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const slugParamSchema = z.object({ slug: z.enum(categorySlugs) });
