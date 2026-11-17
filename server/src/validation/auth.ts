import { z } from 'zod';

const email = z
  .string('Enter your email address.')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address, like name@example.com.'));

const name = z
  .string('Enter your name.')
  .trim()
  .min(2, 'Your name must have at least 2 characters.')
  .max(60, 'Your name can have at most 60 characters.');

/** Optional phone number. Empty means "not provided". */
const phone = z
  .union([
    z.literal(''),
    z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9\s-]{6,17}$/, 'Enter a valid phone number, for example 0300 1234567.'),
  ])
  .optional()
  .transform((v) => v || null);

export const registerSchema = z.object({
  name,
  email,
  password: z
    .string('Choose a password.')
    .min(8, 'Use at least 8 characters.')
    .max(72, 'Use at most 72 characters.')
    .refine((p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p), 'Include at least one letter and one number.'),
  phone,
});

export const loginSchema = z.object({
  email,
  password: z.string('Enter your password.').min(1, 'Enter your password.'),
});

export const profileSchema = z.object({ name, phone });

export const demoLoginSchema = z.object({
  account: z.enum(['owner', 'renter', 'admin']),
});
