import type { ArtKind, CategorySlug } from '../types';

const bySubcategory: Record<string, ArtKind> = {
  'action camera': 'actioncam',
  'console': 'console',
  'controllers': 'controller',
  'vr headsets': 'controller',
  'projectors': 'projector',
  'speakers': 'speaker',
  'microphones': 'speaker',
  'laptops': 'laptop',
  'tablets': 'laptop',
  'sofas': 'sofa',
  'beds': 'sofa',
  'dining': 'sofa',
  'smartwatches': 'watch',
  'luxury watches': 'watch',
  'cars': 'car',
  'vans': 'car',
  'motorcycles': 'bike',
};

const byCategory: Record<CategorySlug, ArtKind> = {
  'cameras-photography': 'camera',
  'gaming-consoles': 'console',
  'bikes-cycles': 'bike',
  'electronics-equipment': 'laptop',
  'furniture-appliances': 'sofa',
  'watches-accessories': 'watch',
  'vehicles': 'car',
};

/** Picks the placeholder illustration for a listing that has no photo yet. */
export function artFor(category: CategorySlug, subcategory?: string | null): ArtKind {
  return (subcategory && bySubcategory[subcategory.toLowerCase()]) || byCategory[category];
}

/** Artwork used on the category cards and banners. */
export const categoryArt: Record<CategorySlug, ArtKind> = {
  'cameras-photography': 'camera',
  'gaming-consoles': 'controller',
  'bikes-cycles': 'bike',
  'electronics-equipment': 'laptop',
  'furniture-appliances': 'sofa',
  'watches-accessories': 'watch',
  'vehicles': 'car',
};
