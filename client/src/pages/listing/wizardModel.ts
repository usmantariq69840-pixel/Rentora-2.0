import type { CategorySlug } from '../../types';

export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CONDITIONS = ['New', 'Like new', 'Excellent', 'Good', 'Fair'] as const;
export type Condition = (typeof CONDITIONS)[number];

export interface Spec { label: string; value: string }

/** Everything the owner types. Numbers stay as text while editing so the field can be empty. */
export interface FormState {
  title: string;
  categorySlug: CategorySlug | '';
  subcategory: string;
  description: string;
  condition: Condition | '';
  dailyPrice: string;
  depositAmount: string;
  location: string;
  availabilityNote: string;
  specs: Spec[];
  tags: string[];
}

export const EMPTY_FORM: FormState = {
  title: '', categorySlug: '', subcategory: '', description: '', condition: '',
  dailyPrice: '', depositAmount: '', location: '', availabilityNote: '', specs: [], tags: [],
};

/** A photo in the list: either a file waiting to upload, or one that is already saved (edit mode). */
export interface Photo {
  key: string;
  url: string;
  file?: File;
  existingId?: number;
}

export type FieldErrors = Record<string, string>;

export const STEPS = [
  { id: 'photos', label: 'Photos', short: 'Photos' },
  { id: 'details', label: 'Item details', short: 'Details' },
  { id: 'rental', label: 'Rental terms', short: 'Rental' },
  { id: 'review', label: 'Review', short: 'Review' },
] as const;

/** Fields the AI can fill in (never the condition, price, deposit or location). */
export type AiField = 'title' | 'categorySlug' | 'subcategory' | 'description' | 'tags' | 'specs';

const whole = (v: string) => /^\d+$/.test(v.trim());

// These messages match the server's, so the same wording shows whether the check ran here or there.
export function validateDetails(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  const title = f.title.trim();
  if (title.length < 5) e.title = 'The title needs at least 5 characters';
  else if (title.length > 80) e.title = 'Keep the title under 80 characters';
  if (!f.categorySlug) e.categorySlug = 'Choose a category';
  if (f.subcategory.trim().length > 40) e.subcategory = 'Keep the subcategory under 40 characters';
  const description = f.description.trim();
  if (description.length < 20) e.description = 'Add at least 20 characters so renters know what they’re getting';
  else if (description.length > 1500) e.description = 'Keep the description under 1,500 characters';
  if (!f.condition) e.condition = 'Choose the condition';
  f.specs.forEach((s, i) => {
    const label = s.label.trim();
    const value = s.value.trim();
    if (!label && !value) return;
    if (!label) e[`specs.${i}.label`] = 'Enter a label';
    if (!value) e[`specs.${i}.value`] = 'Enter a value';
    if (label.length > 30) e[`specs.${i}.label`] = 'Keep the label under 30 characters';
    if (value.length > 80) e[`specs.${i}.value`] = 'Keep the value under 80 characters';
  });
  return e;
}

export function validateRental(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.dailyPrice.trim()) e.dailyPrice = 'Enter the daily price';
  else if (!whole(f.dailyPrice)) e.dailyPrice = 'Use a whole number of rupees';
  else if (Number(f.dailyPrice) < 50) e.dailyPrice = 'The daily price must be at least Rs. 50';
  else if (Number(f.dailyPrice) > 100_000) e.dailyPrice = 'The daily price can’t be more than Rs. 100,000';
  if (!f.depositAmount.trim()) e.depositAmount = 'Enter the deposit (0 for none)';
  else if (!whole(f.depositAmount)) e.depositAmount = 'Use a whole number of rupees';
  else if (Number(f.depositAmount) > 1_000_000) e.depositAmount = 'The deposit can’t be more than Rs. 1,000,000';
  const location = f.location.trim();
  if (location.length < 3) e.location = 'Enter the area, for example “Gulberg, Lahore”';
  else if (location.length > 80) e.location = 'Keep the area under 80 characters';
  if (f.availabilityNote.trim().length > 200) e.availabilityNote = 'Keep the note under 200 characters';
  return e;
}

/** Which step a server-side field error belongs to, so the wizard can jump back to it. */
export function stepOfField(path: string): number {
  const root = path.split('.')[0];
  if (['title', 'categorySlug', 'subcategory', 'description', 'condition', 'specs', 'tags'].includes(root)) return 1;
  if (['dailyPrice', 'depositAmount', 'location', 'availabilityNote'].includes(root)) return 2;
  return 0;
}

/** The JSON the server expects. Empty detail rows are dropped. */
export function toPayload(f: FormState) {
  return {
    title: f.title.trim(),
    categorySlug: f.categorySlug,
    subcategory: f.subcategory.trim() || null,
    description: f.description.trim(),
    condition: f.condition,
    dailyPrice: Number(f.dailyPrice),
    depositAmount: Number(f.depositAmount),
    location: f.location.trim(),
    availabilityNote: f.availabilityNote.trim() || null,
    specs: f.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() })).filter((s) => s.label && s.value),
    tags: f.tags,
  };
}
