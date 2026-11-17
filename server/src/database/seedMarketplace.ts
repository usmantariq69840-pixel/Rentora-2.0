import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { addDays, rentalDays, todayISO } from '../lib/dates.js';
import { uploadsRoot } from '../lib/uploads.js';

/**
 * Extra demo listings with real photos (furniture, phones, watches and vehicles).
 * Photos live in server/seed-images/ and are copied into server/uploads/listings/ on every reset,
 * using fixed file names so repeated resets never pile up duplicates.
 * Prices are daily rental rates in PKR; deposits are demo-only and never charged.
 */
type Spec = { label: string; value: string };

interface MarketListing {
  key: string; // matches the seed-images file prefix: <key>-1.jpg, <key>-2.jpg ...
  owner: string; // email
  category: string; // slug
  sub: string;
  title: string;
  description: string;
  condition: 'New' | 'Like new' | 'Excellent' | 'Good' | 'Fair';
  price: number;
  deposit: number;
  location: string;
  specs: Spec[];
  tags: string[];
  note?: string; // availability note
  images: number; // how many photos exist for the key
  reviews: number; // completed rentals (each with a review) to create; 0 shows the "New" tag
  featured?: boolean;
}

export const marketCategories = [
  { name: 'Furniture & Appliances', slug: 'furniture-appliances', description: 'Sofas, beds, dining sets, refrigerators, air conditioners and other home essentials.' },
  { name: 'Watches & Accessories', slug: 'watches-accessories', description: 'Smartwatches and classic watches for events, weddings and special occasions.' },
  { name: 'Vehicles', slug: 'vehicles', description: 'Motorcycles, cars and vans for city trips, family events and moving day.' },
] as const;

const LICENCE = 'A valid driving licence and CNIC are checked at handover (demo).';

export const marketListings: MarketListing[] = [
  // ---------------- Furniture & Appliances ----------------
  {
    key: 'sofa-bed-blue', owner: 'zainab@rentora.demo', category: 'furniture-appliances', sub: 'Sofas', featured: true,
    title: 'Sofa Cum Bed — Blue Fabric, 2 Seater',
    description: 'A compact blue fabric sofa that pulls out into a full bed, so it works as seating by day and a guest bed at night. Comes with two cushions and has small wheels for easy moving. A handy pick for guests, hostel rooms and short stays.',
    condition: 'Excellent', price: 800, deposit: 5000, location: 'DHA Phase 5, Lahore',
    specs: [{ label: 'Type', value: 'Sofa cum bed (pull-out)' }, { label: 'Seats', value: '2' }, { label: 'Colour', value: 'Blue fabric' }, { label: 'Included', value: '2 cushions' }],
    tags: ['sofa', 'sofa bed', 'guest room', 'furniture'], note: 'Pickup in Lahore. Delivery can be arranged with the owner.', images: 4, reviews: 3,
  },
  {
    key: 'sofa-beige', owner: 'usman@rentora.demo', category: 'furniture-appliances', sub: 'Sofas',
    title: 'Two-Seater Sofa — Beige Fabric',
    description: 'A comfortable two-seater sofa with soft cushions, suited to a temporary flat, an office waiting area or an event. It shows some wear, which is reflected in the price, so please check the photos before booking.',
    condition: 'Fair', price: 350, deposit: 2000, location: 'Iqbal Town, Lahore',
    specs: [{ label: 'Type', value: 'Two-seater sofa' }, { label: 'Colour', value: 'Beige fabric' }, { label: 'Wear', value: 'Visible, see photos' }],
    tags: ['sofa', 'two seater', 'furniture'], note: 'Pickup only.', images: 1, reviews: 1,
  },
  {
    key: 'sofa-grey', owner: 'ayesha@rentora.demo', category: 'furniture-appliances', sub: 'Sofas',
    title: 'Two-Seater Sofa — Light Grey with Cushions',
    description: 'A clean light grey two-seater sofa with four scatter cushions. A neat choice for a living room, a photoshoot set or a short-term rental flat.',
    condition: 'Good', price: 650, deposit: 4000, location: 'Faisal Town, Lahore',
    specs: [{ label: 'Type', value: 'Two-seater sofa' }, { label: 'Colour', value: 'Light grey fabric' }, { label: 'Included', value: '4 scatter cushions' }],
    tags: ['sofa', 'two seater', 'living room', 'furniture'], note: 'Delivery can be discussed with the owner.', images: 1, reviews: 2,
  },
  {
    key: 'dining-table', owner: 'owner@rentora.demo', category: 'furniture-appliances', sub: 'Dining',
    title: 'Wooden Dining Table with High-Back Chairs',
    description: 'A long solid wood dining table with carved high-back chairs and a dark marble-print table runner. Great for family dinners, iftar gatherings and small events at home. The table runner and the decor on it in the photos are not part of the rental unless you ask.',
    condition: 'Good', price: 1800, deposit: 10000, location: 'Model Town, Lahore',
    specs: [{ label: 'Type', value: 'Dining table with chairs' }, { label: 'Material', value: 'Dark-finish wood' }, { label: 'Chairs', value: 'Carved high-back' }],
    tags: ['dining table', 'chairs', 'events', 'furniture'], note: 'Pickup needs a loader or van. Delivery can be arranged.', images: 3, reviews: 2,
  },
  {
    key: 'bed-luxury', owner: 'bilal@rentora.demo', category: 'furniture-appliances', sub: 'Beds',
    title: 'Luxury Upholstered Bed with Side Tables',
    description: 'A modern bed with a tall panelled velvet headboard, gold-tone trim and two matching side tables with drawers. It makes a strong statement in a bedroom, a model apartment or a photoshoot. The photos show the frame only, so please ask the owner about a mattress.',
    condition: 'Excellent', price: 2000, deposit: 12000, location: 'Bahria Town, Lahore',
    specs: [{ label: 'Type', value: 'Bed frame with side tables' }, { label: 'Finish', value: 'Dark upholstered, gold trim' }, { label: 'Mattress', value: 'Not shown, ask the owner' }],
    tags: ['bed', 'king bed', 'bedroom', 'furniture'], note: 'Delivery and assembly can be discussed with the owner.', images: 1, reviews: 0,
  },
  {
    key: 'bed-white', owner: 'ayesha@rentora.demo', category: 'furniture-appliances', sub: 'Beds',
    title: 'White Double Bed with Dressing Table Set',
    description: 'A bright white double bed with a green tufted headboard, a bedside table and a matching dressing table with a mirror. Suited to a guest room or a staged home. The rug, lamp and wall frames in the photos are not included.',
    condition: 'Excellent', price: 1500, deposit: 8000, location: 'Valencia Town, Lahore',
    specs: [{ label: 'Type', value: 'Double bed set' }, { label: 'Finish', value: 'White with green headboard' }, { label: 'Included', value: 'Bed, side table, dressing table' }],
    tags: ['bed', 'double bed', 'dressing table', 'bedroom'], note: 'Pickup or delivery by arrangement.', images: 1, reviews: 1,
  },
  {
    key: 'bed-dark-wood', owner: 'hamza@rentora.demo', category: 'furniture-appliances', sub: 'Beds',
    title: 'Classic Dark Wood Double Bed with Side Tables',
    description: 'A traditional carved dark wood double bed with two matching side tables. Solid and roomy, a practical choice for a rented flat or a guest room. Shows normal signs of use.',
    condition: 'Good', price: 900, deposit: 5000, location: 'Township, Lahore',
    specs: [{ label: 'Type', value: 'Double bed with 2 side tables' }, { label: 'Material', value: 'Dark wood' }, { label: 'Style', value: 'Classic carved headboard' }],
    tags: ['bed', 'double bed', 'wood', 'bedroom'], note: 'Pickup only. Disassembly can be done with the owner.', images: 1, reviews: 2,
  },
  {
    key: 'fridge-steel', owner: 'usman@rentora.demo', category: 'furniture-appliances', sub: 'Refrigerators',
    title: 'Double-Door Refrigerator — Stainless Steel Finish',
    description: 'A two-door fridge with a steel finish, a freezer on top and a roomy fridge section below. Useful for a short-term flat, a shop or an event. After transport, let it stand upright for a while before you switch it on and load food.',
    condition: 'Good', price: 600, deposit: 6000, location: 'Johar Town, Lahore',
    specs: [{ label: 'Type', value: 'Double-door, top freezer' }, { label: 'Finish', value: 'Stainless steel look' }],
    tags: ['fridge', 'refrigerator', 'appliance'], note: 'Pickup needs a loader. Delivery can be arranged.', images: 1, reviews: 2,
  },
  {
    key: 'fridge-white', owner: 'zainab@rentora.demo', category: 'furniture-appliances', sub: 'Refrigerators',
    title: 'White Top-Freezer Refrigerator',
    description: 'A tall, slim white fridge with a freezer compartment on top. Good for a bachelor flat, a small office or a hostel room. It needs only a standard power socket.',
    condition: 'Good', price: 450, deposit: 4000, location: 'Cantt, Lahore',
    specs: [{ label: 'Type', value: 'Top freezer' }, { label: 'Colour', value: 'White' }, { label: 'Size', value: 'Tall and slim' }],
    tags: ['fridge', 'refrigerator', 'appliance', 'small flat'], note: 'Pickup or delivery by arrangement.', images: 1, reviews: 1,
  },
  {
    key: 'split-ac', owner: 'bilal@rentora.demo', category: 'furniture-appliances', sub: 'Air conditioners',
    title: 'Split Air Conditioner — Wall Mounted',
    description: 'A white wall-mounted split AC with its indoor unit and remote. Handy for a hot-season rental, a guest room or an event space. The photos show an installed unit and units in protective wrap. Installation is not included unless you agree it with the owner first.',
    condition: 'Good', price: 1000, deposit: 8000, location: 'Wapda Town, Lahore',
    specs: [{ label: 'Type', value: 'Wall-mounted split' }, { label: 'Colour', value: 'White' }, { label: 'Installation', value: 'Agree with the owner' }],
    tags: ['ac', 'air conditioner', 'split ac', 'appliance', 'summer'], note: 'Book early in summer. Installation is arranged separately.', images: 2, reviews: 3,
  },

  // ---------------- Electronics & Equipment ----------------
  {
    key: 'iphone-15-pro', owner: 'owner@rentora.demo', category: 'electronics-equipment', sub: 'Smartphones', featured: true,
    title: 'iPhone 15 Pro — White Titanium',
    description: 'A white titanium iPhone 15 Pro with a triple-lens camera. Handy when you need a strong camera or a spare phone for travel, a shoot or an event. The owner checks the screen and condition with you at handover.',
    condition: 'Excellent', price: 3200, deposit: 60000, location: 'Gulberg, Lahore',
    specs: [{ label: 'Model', value: 'iPhone 15 Pro' }, { label: 'Colour', value: 'White titanium' }, { label: 'Cameras', value: 'Triple lens' }],
    tags: ['iphone', 'apple', 'smartphone', 'camera phone'], note: 'Handover in person only.', images: 3, reviews: 3,
  },
  {
    key: 'iphone-18-pro', owner: 'hamza@rentora.demo', category: 'electronics-equipment', sub: 'Smartphones',
    title: 'Apple iPhone 18 Pro — Boxed',
    description: 'A new-generation iPhone 18 Pro that comes with its original Apple box. Good for people who want to try the latest model for a week or cover a demo or product launch. Please confirm the colour and storage with the owner before you book.',
    condition: 'Like new', price: 4800, deposit: 100000, location: 'Johar Town, Lahore',
    specs: [{ label: 'Model', value: 'iPhone 18 Pro' }, { label: 'Box', value: 'Original box included' }, { label: 'Storage', value: 'Ask the owner' }],
    tags: ['iphone', 'apple', 'smartphone', 'latest'], note: 'Handover in person only, with ID check.', images: 2, reviews: 0,
  },
  {
    key: 'samsung-s22', owner: 'usman@rentora.demo', category: 'electronics-equipment', sub: 'Smartphones',
    title: 'Samsung Galaxy S22 — Choose Your Colour',
    description: 'Samsung Galaxy S22 phones in several colours, such as green, pink, black and light blue. A solid Android phone for a few days of travel, a backup device or a trial before buying. Tell the owner which colour you prefer when you book.',
    condition: 'Good', price: 1500, deposit: 25000, location: 'Iqbal Town, Lahore',
    specs: [{ label: 'Model', value: 'Samsung Galaxy S22' }, { label: 'Colours', value: 'Several, ask the owner' }],
    tags: ['samsung', 'galaxy', 'android', 'smartphone'], note: 'Colour is subject to availability.', images: 1, reviews: 2,
  },
  {
    key: 'samsung-ultra', owner: 'bilal@rentora.demo', category: 'electronics-equipment', sub: 'Smartphones',
    title: 'Samsung Galaxy Ultra Smartphone — Titanium',
    description: 'A premium Samsung Ultra-series phone in a titanium finish with a quad rear camera, shown in its box. Suited to photography-heavy weekends and trips. Please confirm the exact model and storage with the owner before you book.',
    condition: 'Excellent', price: 2800, deposit: 60000, location: 'Bahria Town, Lahore',
    specs: [{ label: 'Series', value: 'Samsung Galaxy Ultra' }, { label: 'Finish', value: 'Titanium' }, { label: 'Box', value: 'Included' }],
    tags: ['samsung', 'galaxy', 'ultra', 'android', 'smartphone'], note: 'Handover in person only.', images: 2, reviews: 0,
  },
  {
    key: 'tecno-camon', owner: 'ayesha@rentora.demo', category: 'electronics-equipment', sub: 'Smartphones',
    title: 'Tecno Camon 50 — Everyday Android Phone',
    description: 'A budget-friendly Tecno Camon 50 with a three-lens camera block, good for day-to-day use, a spare phone or a short trip. Photos show the back of the phone and the home screen.',
    condition: 'Good', price: 700, deposit: 10000, location: 'Faisal Town, Lahore',
    specs: [{ label: 'Model', value: 'Tecno Camon 50' }, { label: 'Colour', value: 'Dark grey-green' }],
    tags: ['tecno', 'camon', 'android', 'smartphone', 'budget'], note: 'Pickup or meet-up in Lahore.', images: 2, reviews: 1,
  },
  {
    key: 'iphone-pro-black', owner: 'zainab@rentora.demo', category: 'electronics-equipment', sub: 'Smartphones',
    title: 'iPhone Pro — Black Titanium',
    description: 'A black titanium iPhone Pro with a triple camera, shown from the back and the side. Suited to shoots, travel and short work projects. Please confirm the model and storage with the owner before you book.',
    condition: 'Excellent', price: 3000, deposit: 60000, location: 'Township, Lahore',
    specs: [{ label: 'Series', value: 'iPhone Pro' }, { label: 'Colour', value: 'Black titanium' }, { label: 'Cameras', value: 'Triple lens' }],
    tags: ['iphone', 'apple', 'smartphone', 'camera phone'], note: 'Handover in person only.', images: 3, reviews: 2,
  },
  {
    key: 'macbook-pro', owner: 'owner@rentora.demo', category: 'electronics-equipment', sub: 'Laptops',
    title: 'MacBook Pro 13-inch — Silver',
    description: 'A silver 13-inch MacBook Pro with a clear Retina-style display and backlit keyboard. Dependable for assignments, writing, coding and presentations. Photos show the laptop only, so please confirm the charger with the owner before you book.',
    condition: 'Good', price: 1800, deposit: 25000, location: 'Gulberg, Lahore',
    specs: [{ label: 'Type', value: 'MacBook Pro 13-inch' }, { label: 'Colour', value: 'Silver' }, { label: 'Charger', value: 'Confirm with the owner' }],
    tags: ['macbook', 'laptop', 'apple', 'assignments'], note: 'Handover in person only.', images: 2, reviews: 2,
  },
  {
    key: 'acoustic-guitars', owner: 'hamza@rentora.demo', category: 'electronics-equipment', sub: 'Musical instruments',
    title: 'Acoustic Guitar — Cutaway (Natural or Black)',
    description: 'Six-string acoustic guitars with a cutaway body, available in a natural wood finish or in black. Good for practice, a bonfire, a music night or a performance. Tell the owner which one you prefer when you book.',
    condition: 'Good', price: 600, deposit: 5000, location: 'Johar Town, Lahore',
    specs: [{ label: 'Type', value: 'Acoustic, cutaway' }, { label: 'Finishes', value: 'Natural or black' }, { label: 'Strings', value: '6' }],
    tags: ['guitar', 'acoustic', 'music', 'instrument'], note: 'Pickup only.', images: 1, reviews: 2,
  },

  // ---------------- Watches & Accessories ----------------
  {
    key: 'apple-watch-s8', owner: 'ayesha@rentora.demo', category: 'watches-accessories', sub: 'Smartwatches',
    title: 'Apple Watch Series 8 — Black Sport Band',
    description: 'An Apple Watch Series 8 with a black sport band, shown with its original box. Useful for fitness tracking on a trip, a trial before buying or a short event. The watch is handed over unpaired. Please bring your own phone to pair it.',
    condition: 'Excellent', price: 1000, deposit: 20000, location: 'Faisal Town, Lahore',
    specs: [{ label: 'Model', value: 'Apple Watch Series 8' }, { label: 'Band', value: 'Black sport band' }, { label: 'Box', value: 'Original box' }],
    tags: ['apple watch', 'smartwatch', 'fitness', 'wearable'], note: 'Handover in person only.', images: 2, reviews: 3,
  },
  {
    key: 'rolex-datejust', owner: 'bilal@rentora.demo', category: 'watches-accessories', sub: 'Luxury watches', featured: true,
    title: 'Rolex Datejust — Steel with Jubilee Bracelet',
    description: 'A stainless steel Rolex Datejust with a silver dial, fluted bezel, date window and a Jubilee-style bracelet. A dressy choice for weddings, interviews and photoshoots. Condition is as shown in the photos. The deposit is held in this demo only and a handover check is done in person.',
    condition: 'Excellent', price: 4500, deposit: 250000, location: 'DHA Phase 5, Lahore',
    specs: [{ label: 'Model', value: 'Rolex Datejust' }, { label: 'Case', value: 'Stainless steel' }, { label: 'Dial', value: 'Silver, with date' }],
    tags: ['rolex', 'datejust', 'luxury watch', 'wedding'], note: 'Handover in person with ID. Booked for events, so book early.', images: 1, reviews: 2,
  },
  {
    key: 'blue-chronograph', owner: 'zainab@rentora.demo', category: 'watches-accessories', sub: 'Luxury watches',
    title: 'Blue Dial Chronograph — Gem-Set Bezel',
    description: 'A striking blue dial chronograph with a gem-set bezel and a blue leather strap. A real head-turner for weddings, dinners and shoots. Condition is as shown in the photos.',
    condition: 'Excellent', price: 6000, deposit: 150000, location: 'Township, Lahore',
    specs: [{ label: 'Style', value: 'Chronograph' }, { label: 'Dial', value: 'Blue' }, { label: 'Strap', value: 'Blue leather' }],
    tags: ['chronograph', 'blue dial', 'luxury watch', 'wedding'], note: 'Handover in person with ID.', images: 1, reviews: 0,
  },
  {
    key: 'rolex-panda', owner: 'usman@rentora.demo', category: 'watches-accessories', sub: 'Luxury watches',
    title: 'Vintage Rolex Chronograph — Panda Dial',
    description: 'A vintage-style Rolex chronograph with a cream dial and black sub-dials on a steel bracelet. It stands out at weddings, themed shoots and special dinners. Condition is as shown in the photos, and a handover check is done in person.',
    condition: 'Good', price: 7500, deposit: 400000, location: 'Iqbal Town, Lahore',
    specs: [{ label: 'Style', value: 'Vintage chronograph' }, { label: 'Dial', value: 'Cream with black sub-dials' }, { label: 'Bracelet', value: 'Steel' }],
    tags: ['rolex', 'chronograph', 'vintage', 'luxury watch'], note: 'Handover in person with ID.', images: 1, reviews: 0,
  },
  {
    key: 'rolex-oysterdate', owner: 'hamza@rentora.demo', category: 'watches-accessories', sub: 'Luxury watches',
    title: 'Rolex Oysterdate Precision — Vintage',
    description: 'A classic vintage Rolex Oysterdate Precision with a silver dial, baton markers, a date window and a steel bracelet. A quiet, timeless piece for formal occasions. It is vintage and shows its age, as the photo shows.',
    condition: 'Good', price: 3500, deposit: 150000, location: 'Model Town, Lahore',
    specs: [{ label: 'Model', value: 'Rolex Oysterdate Precision' }, { label: 'Era', value: 'Vintage' }, { label: 'Bracelet', value: 'Steel' }],
    tags: ['rolex', 'vintage', 'classic', 'luxury watch'], note: 'Handover in person with ID.', images: 1, reviews: 1,
  },

  // ---------------- Vehicles ----------------
  {
    key: 'honda-cd70', owner: 'usman@rentora.demo', category: 'vehicles', sub: 'Motorcycles',
    title: 'Honda CD 70 Motorcycle — Black',
    description: `A reliable black Honda CD 70 with the orange and black graphics, good for city errands and short trips across Lahore. Fuel is not included. ${LICENCE}`,
    condition: 'Good', price: 900, deposit: 15000, location: 'Iqbal Town, Lahore',
    specs: [{ label: 'Type', value: 'Motorcycle, 70cc' }, { label: 'Make', value: 'Honda CD 70' }, { label: 'Colour', value: 'Black' }, { label: 'Fuel', value: 'Not included' }],
    tags: ['honda', 'cd70', 'motorcycle', 'bike', 'commute'], note: 'Return with the same fuel level.', images: 5, reviews: 3,
  },
  {
    key: 'yamaha-ybr', owner: 'hamza@rentora.demo', category: 'vehicles', sub: 'Motorcycles',
    title: 'Yamaha YBR 125 — Custom Maroon Paint',
    description: `A Yamaha 125cc motorcycle with a custom maroon and silver-fleck paint finish. Comfortable for longer rides and weekend trips. Fuel is not included. ${LICENCE}`,
    condition: 'Good', price: 1600, deposit: 25000, location: 'Model Town, Lahore',
    specs: [{ label: 'Type', value: 'Motorcycle, 125cc' }, { label: 'Make', value: 'Yamaha' }, { label: 'Finish', value: 'Custom maroon and silver' }, { label: 'Fuel', value: 'Not included' }],
    tags: ['yamaha', 'ybr', '125', 'motorcycle', 'bike'], note: 'Return with the same fuel level.', images: 4, reviews: 2,
  },
  {
    key: 'honda-civic', owner: 'owner@rentora.demo', category: 'vehicles', sub: 'Cars', featured: true,
    title: 'Honda Civic Reborn Sedan — Green',
    description: `A green Honda Civic Reborn sedan in tidy condition, a comfortable pick for weddings, airport runs and out-of-town trips. Fuel is not included. ${LICENCE}`,
    condition: 'Good', price: 9500, deposit: 100000, location: 'Gulberg, Lahore',
    specs: [{ label: 'Type', value: 'Sedan' }, { label: 'Make', value: 'Honda Civic Reborn' }, { label: 'Colour', value: 'Green' }, { label: 'Fuel', value: 'Not included' }],
    tags: ['honda', 'civic', 'car', 'sedan', 'wedding'], note: 'Self-drive. Return with the same fuel level.', images: 2, reviews: 3,
  },
  {
    key: 'hiace-commuter', owner: 'bilal@rentora.demo', category: 'vehicles', sub: 'Vans',
    title: 'Toyota HiAce Commuter Van — High Roof',
    description: `A white high-roof Toyota HiAce passenger van with plenty of room for family trips, group outings and event transport. Fuel is not included. ${LICENCE}`,
    condition: 'Good', price: 18000, deposit: 150000, location: 'DHA Phase 5, Lahore',
    specs: [{ label: 'Type', value: 'Passenger van, high roof' }, { label: 'Make', value: 'Toyota HiAce' }, { label: 'Colour', value: 'White' }, { label: 'Fuel', value: 'Not included' }],
    tags: ['toyota', 'hiace', 'van', 'group travel', 'family'], note: 'Ask the owner whether a driver can be arranged.', images: 1, reviews: 2,
  },
  {
    key: 'suzuki-every', owner: 'zainab@rentora.demo', category: 'vehicles', sub: 'Vans',
    title: 'Suzuki Every Mini Van — White',
    description: `A compact white mini van that is easy to park and cheap to run. A good pick for small moves, deliveries and stall setups around the city. Fuel is not included. ${LICENCE}`,
    condition: 'Good', price: 6500, deposit: 50000, location: 'Township, Lahore',
    specs: [{ label: 'Type', value: 'Mini van' }, { label: 'Make', value: 'Suzuki Every' }, { label: 'Colour', value: 'White' }, { label: 'Fuel', value: 'Not included' }],
    tags: ['suzuki', 'every', 'mini van', 'moving', 'delivery'], note: 'Return with the same fuel level.', images: 1, reviews: 1,
  },
  {
    key: 'hiace-cargo', owner: 'ayesha@rentora.demo', category: 'vehicles', sub: 'Vans',
    title: 'Toyota HiAce Cargo Van — White Panel Van',
    description: `A white Toyota HiAce panel van with a large closed cargo area, handy for moving house, deliveries and event equipment. Fuel is not included. ${LICENCE}`,
    condition: 'Good', price: 12000, deposit: 100000, location: 'Johar Town, Lahore',
    specs: [{ label: 'Type', value: 'Panel (cargo) van' }, { label: 'Make', value: 'Toyota HiAce' }, { label: 'Colour', value: 'White' }, { label: 'Fuel', value: 'Not included' }],
    tags: ['toyota', 'hiace', 'cargo van', 'moving', 'delivery'], note: 'Ask the owner whether a driver can be arranged.', images: 1, reviews: 0,
  },
];

const reviewPool: { rating: number; comment: string }[] = [
  { rating: 5, comment: 'Exactly as described and in great condition. Handover was quick and easy.' },
  { rating: 5, comment: 'The owner was friendly and flexible with timing. Would rent again.' },
  { rating: 5, comment: 'Clean, well looked after and ready to use. Smooth handover.' },
  { rating: 5, comment: 'Worked perfectly for what I needed. Highly recommended.' },
  { rating: 4, comment: 'Good condition overall. Pickup took a little longer than planned, but all fine.' },
  { rating: 4, comment: 'Great value for a short rental. Clear communication from the owner.' },
  { rating: 4, comment: 'Did the job well. Minor cosmetic wear that did not affect use.' },
];

const seedImagesDir = path.resolve(import.meta.dirname, '../../seed-images');

/** Copies the bundled photos into the uploads folder (fixed names) and returns the stored paths. */
function installImages(key: string, count: number): string[] {
  const listingDir = path.join(uploadsRoot, 'listings');
  fs.mkdirSync(listingDir, { recursive: true });
  const stored: string[] = [];
  for (let n = 1; n <= count; n++) {
    const file = `${key}-${n}.jpg`;
    const from = path.join(seedImagesDir, file);
    if (!fs.existsSync(from)) {
      console.warn(`Seed photo missing: ${file}`);
      continue;
    }
    fs.copyFileSync(from, path.join(listingDir, `seed-${file}`));
    stored.push(`listings/seed-${file}`);
  }
  return stored;
}

/** Adds the extra listings, their photos, and a few completed, reviewed rentals so ratings show up. */
export function seedMarketplace(db: Database.Database, userId: Record<string, number>, categoryId: Record<string, number>) {
  const today = todayISO();
  const daysAgoIso = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  // A separate generator, so adding these never changes the original demo data.
  let s = 7331;
  const random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };

  const insertListing = db.prepare(`
    INSERT INTO listings (owner_id, category_id, title, subcategory, description, item_condition, daily_price, deposit_amount,
                          location_text, specs, tags, availability_note, status, featured_until, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`);
  const insertImage = db.prepare('INSERT INTO listing_images (listing_id, file_path, is_cover, sort_order) VALUES (?, ?, ?, ?)');
  const insertPromotion = db.prepare('INSERT INTO demo_promotions (listing_id, plan_name, start_at, end_at) VALUES (?, ?, ?, ?)');
  const insertBooking = db.prepare(`
    INSERT INTO bookings (listing_id, renter_id, owner_id, start_date, end_date, rental_days, daily_price_snapshot,
                          rental_total, deposit_snapshot, status, demo_payment_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'confirmed', ?)`);
  const insertHistory = db.prepare('INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?)');
  const insertReview = db.prepare('INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)');

  const featuredEnd = new Date(Date.now() + 25 * 86_400_000).toISOString();
  const renters = Object.keys(userId).filter((e) => e !== 'admin@rentora.demo');

  marketListings.forEach((l, i) => {
    const created = daysAgoIso(100 - i * 3);
    const id = Number(
      insertListing.run(
        userId[l.owner], categoryId[l.category], l.title, l.sub, l.description, l.condition, l.price, l.deposit, l.location,
        JSON.stringify(l.specs), JSON.stringify(l.tags), l.note ?? null, l.featured ? featuredEnd : null, created, created,
      ).lastInsertRowid,
    );
    installImages(l.key, l.images).forEach((p, n) => insertImage.run(id, p, n === 0 ? 1 : 0, n));
    if (l.featured) insertPromotion.run(id, 'Featured · 30 days (demo)', daysAgoIso(4), featuredEnd);

    const eligible = renters.filter((e) => e !== l.owner);
    for (let k = 0; k < l.reviews; k++) {
      const start = addDays(today, -(12 + k * 19 + Math.floor(random() * 6)));
      const end = addDays(start, Math.floor(random() * 3));
      const days = rentalDays(start, end);
      const renter = eligible[Math.floor(random() * eligible.length)];
      const requested = new Date(Date.parse(`${start}T09:00:00Z`) - 4 * 86_400_000).toISOString();
      const bookingId = Number(
        insertBooking.run(id, userId[renter], userId[l.owner], start, end, days, l.price, days * l.price, l.deposit, requested).lastInsertRowid,
      );
      insertHistory.run(bookingId, null, 'pending', userId[renter], requested);
      insertHistory.run(bookingId, 'pending', 'approved', userId[l.owner], requested);
      insertHistory.run(bookingId, 'approved', 'completed', userId[l.owner], new Date(Date.parse(`${end}T18:00:00Z`)).toISOString());
      const review = reviewPool[Math.floor(random() * reviewPool.length)];
      insertReview.run(bookingId, userId[renter], userId[l.owner], review.rating, review.comment,
        new Date(Date.parse(`${end}T20:00:00Z`) + 86_400_000).toISOString());
    }
  });
}
