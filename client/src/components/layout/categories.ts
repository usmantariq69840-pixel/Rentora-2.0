import { Bike, Camera, CarFront, Gamepad2, Laptop, Sofa, Watch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CategorySlug } from '../../types';

/** Static navigation metadata for every category. */
export const categoryNav: { slug: CategorySlug; name: string; /** Shorter label for the crowded category bar */ short: string; icon: LucideIcon }[] = [
  { slug: 'cameras-photography', name: 'Cameras & Photography', short: 'Cameras', icon: Camera },
  { slug: 'gaming-consoles', name: 'Gaming Consoles', short: 'Gaming', icon: Gamepad2 },
  { slug: 'bikes-cycles', name: 'Bikes & Cycles', short: 'Bikes & Cycles', icon: Bike },
  { slug: 'electronics-equipment', name: 'Electronics & Equipment', short: 'Electronics', icon: Laptop },
  { slug: 'furniture-appliances', name: 'Furniture & Appliances', short: 'Furniture', icon: Sofa },
  { slug: 'watches-accessories', name: 'Watches & Accessories', short: 'Watches', icon: Watch },
  { slug: 'vehicles', name: 'Vehicles', short: 'Vehicles', icon: CarFront },
];
