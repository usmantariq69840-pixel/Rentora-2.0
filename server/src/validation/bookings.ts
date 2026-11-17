import { z } from 'zod';
import { isIsoDate } from '../lib/dates.js';

const isoDate = (label: string) =>
  z.string(`Choose a ${label} date.`).refine(isIsoDate, `Enter the ${label} date as a real calendar date.`);

export const createBookingSchema = z.object({
  listingId: z.coerce.number('Choose an item to rent.').int().positive(),
  startDate: isoDate('start'),
  endDate: isoDate('end'),
});

export const statusSchema = z.object({
  status: z.enum(['approved', 'declined', 'cancelled', 'completed'], 'Choose a valid status.'),
});
