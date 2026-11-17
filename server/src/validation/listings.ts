import { z } from 'zod';
import { categorySlugs } from './items.js';

export const conditions = ['New', 'Like new', 'Excellent', 'Good', 'Fair'] as const;

const emptyToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export const specSchema = z.object({
  label: z.string('Enter a label').trim().min(1, 'Enter a label').max(30, 'Keep the label under 30 characters'),
  value: z.string('Enter a value').trim().min(1, 'Enter a value').max(80, 'Keep the value under 80 characters'),
});

/** Fields the owner fills in. Used for both creating and editing a listing. */
export const listingInputSchema = z.object({
  title: z.string('Enter a title').trim().min(5, 'The title needs at least 5 characters').max(80, 'Keep the title under 80 characters'),
  categorySlug: z.enum(categorySlugs, 'Choose a category'),
  subcategory: z.string().trim().max(40, 'Keep the subcategory under 40 characters').nullish().transform(emptyToNull),
  description: z.string('Add a description').trim().min(20, 'Add at least 20 characters so renters know what they’re getting').max(1500, 'Keep the description under 1,500 characters'),
  condition: z.enum(conditions, 'Choose the condition'),
  dailyPrice: z.number('Enter the daily price').int('Use a whole number of rupees').min(50, 'The daily price must be at least Rs. 50').max(100_000, 'The daily price can’t be more than Rs. 100,000'),
  depositAmount: z.number('Enter the deposit (0 for none)').int('Use a whole number of rupees').min(0, 'The deposit can’t be negative').max(1_000_000, 'The deposit can’t be more than Rs. 1,000,000'),
  location: z.string('Enter the area').trim().min(3, 'Enter the area, for example “Gulberg, Lahore”').max(80, 'Keep the area under 80 characters'),
  availabilityNote: z.string().trim().max(200, 'Keep the note under 200 characters').nullish().transform(emptyToNull),
  specs: z.array(specSchema).max(8, 'You can add up to 8 details').default([]),
  tags: z.array(z.string().trim().toLowerCase().min(2).max(24)).max(8, 'You can add up to 8 tags').default([]),
});
export type ListingInput = z.infer<typeof listingInputSchema>;

/** Extra fields that only exist when editing: which existing photos to drop and which photo is the cover. */
export const listingUpdateSchema = listingInputSchema.extend({
  removeImageIds: z.array(z.number().int().positive()).max(12).default([]),
  coverImageId: z.number().int().positive().nullish(),
  coverNewIndex: z.number().int().min(0).max(5).nullish(),
});
export const listingCreateSchema = listingInputSchema.extend({
  coverNewIndex: z.number().int().min(0).max(5).nullish(),
});

export const adminStatusSchema = z.object({ status: z.enum(['approved', 'hidden'], 'Choose approved or hidden') });
