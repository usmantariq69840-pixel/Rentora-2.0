import type Database from 'better-sqlite3';
import { addDays, rentalDays, todayISO } from '../lib/dates.js';
import { hashPassword } from '../lib/password.js';
import { marketCategories, seedMarketplace } from './seedMarketplace.js';

/** Every demo account uses this password. Demo only — never reuse a real password. */
export const DEMO_PASSWORD = 'Rentora@2026';

type Spec = { label: string; value: string };
interface SeedListing {
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
  featured?: boolean;
  status?: 'approved' | 'pending';
}

const users = [
  { name: 'Rentora Admin', email: 'admin@rentora.demo', role: 'admin', ev: 1, pv: 1 },
  { name: 'Ahmed Khan', email: 'owner@rentora.demo', role: 'user', ev: 1, pv: 1 },
  { name: 'Sara Malik', email: 'renter@rentora.demo', role: 'user', ev: 1, pv: 1 },
  { name: 'Hamza Ali', email: 'hamza@rentora.demo', role: 'user', ev: 1, pv: 0 },
  { name: 'Ayesha Noor', email: 'ayesha@rentora.demo', role: 'user', ev: 1, pv: 1 },
  { name: 'Usman Raza', email: 'usman@rentora.demo', role: 'user', ev: 1, pv: 0 },
  { name: 'Bilal Ahmad', email: 'bilal@rentora.demo', role: 'user', ev: 1, pv: 1 },
  { name: 'Zainab Tariq', email: 'zainab@rentora.demo', role: 'user', ev: 0, pv: 1 },
] as const;

const categories = [
  { name: 'Cameras & Photography', slug: 'cameras-photography', description: 'DSLR and mirrorless cameras, lenses, tripods, lights, microphones and action cameras.' },
  { name: 'Gaming Consoles', slug: 'gaming-consoles', description: 'PlayStation, Xbox, controllers, VR headsets and gaming accessories.' },
  { name: 'Bikes & Cycles', slug: 'bikes-cycles', description: 'Bicycles and everyday cycling accessories.' },
  { name: 'Electronics & Equipment', slug: 'electronics-equipment', description: 'Projectors, speakers, tablets, laptops, microphones and general equipment.' },
];

const listings: SeedListing[] = [
  // ---- Cameras & Photography ----
  {
    owner: 'owner@rentora.demo', category: 'cameras-photography', sub: 'Mirrorless', featured: true,
    title: 'Sony A7 III Mirrorless Camera',
    description: 'A full-frame mirrorless camera that is great for photography and videography. Comes with battery, charger and strap. Ideal for shoots, events, university projects and travel.',
    condition: 'Excellent', price: 2500, deposit: 15000, location: 'Gulberg, Lahore',
    specs: [
      { label: 'Type', value: 'Full-frame mirrorless' },
      { label: 'Sensor', value: '24.2 MP' },
      { label: 'Video', value: '4K' },
      { label: 'Included', value: 'Battery, charger, strap' },
    ],
  },
  {
    owner: 'zainab@rentora.demo', category: 'cameras-photography', sub: 'Mirrorless', featured: true,
    title: 'Canon EOS R6 Body',
    description: 'Fast, reliable full-frame mirrorless body that handles low light very well. Body only — bring your own lens or ask the owner whether one can be arranged.',
    condition: 'Excellent', price: 2200, deposit: 12000, location: 'DHA Phase 5, Lahore',
    specs: [
      { label: 'Type', value: 'Full-frame mirrorless' },
      { label: 'Sensor', value: '20.1 MP' },
      { label: 'Video', value: '4K' },
      { label: 'Included', value: 'Body, battery, charger' },
    ],
  },
  {
    owner: 'bilal@rentora.demo', category: 'cameras-photography', sub: 'Action camera',
    title: 'GoPro Hero 12 Black',
    description: 'Compact, waterproof action camera for trips, sports and vlogs. Good for hands-free shooting and stable footage on the move.',
    condition: 'Excellent', price: 1500, deposit: 8000, location: 'Model Town, Lahore',
    specs: [
      { label: 'Type', value: 'Action camera' },
      { label: 'Video', value: 'Up to 5.3K' },
      { label: 'Included', value: 'Battery, charger, mount' },
    ],
  },
  {
    owner: 'bilal@rentora.demo', category: 'cameras-photography', sub: 'Mirrorless', featured: true,
    title: 'Fujifilm X-T5 Mirrorless Camera',
    description: 'High-resolution APS-C camera with a classic dial-based layout. A favourite for portraits, street photography and travel work.',
    condition: 'Like new', price: 2000, deposit: 13000, location: 'Johar Town, Lahore',
    specs: [
      { label: 'Type', value: 'APS-C mirrorless' },
      { label: 'Sensor', value: '40.2 MP' },
      { label: 'Included', value: 'Battery, charger, strap' },
    ],
  },
  {
    owner: 'owner@rentora.demo', category: 'cameras-photography', sub: 'DSLR',
    title: 'Nikon D5600 DSLR with 18–55mm Lens',
    description: 'A friendly DSLR kit for students and beginners. Lightweight, easy to use and a good fit for coursework and family events.',
    condition: 'Good', price: 1400, deposit: 9000, location: 'Gulberg, Lahore',
    specs: [
      { label: 'Type', value: 'APS-C DSLR' },
      { label: 'Sensor', value: '24.2 MP' },
      { label: 'Included', value: 'Kit lens, battery, charger, bag' },
    ],
  },
  {
    owner: 'zainab@rentora.demo', category: 'cameras-photography', sub: 'Tripods & lighting',
    title: 'Tripod and LED Light Kit',
    description: 'Sturdy tripod with two adjustable LED panels. Handy for product shots, interviews and small studio setups.',
    condition: 'Good', price: 700, deposit: 4000, location: 'Cantt, Lahore',
    specs: [
      { label: 'Included', value: 'Tripod, 2 LED panels, stands' },
      { label: 'Power', value: 'Mains adapters included' },
    ],
  },
  {
    owner: 'owner@rentora.demo', category: 'cameras-photography', sub: 'Lenses',
    title: 'Canon RF 50mm f/1.8 Lens',
    description: 'Lightweight prime lens for portraits and low-light shooting. Awaiting moderator review.',
    condition: 'Excellent', price: 900, deposit: 6000, location: 'Gulberg, Lahore',
    specs: [{ label: 'Mount', value: 'Canon RF' }], status: 'pending',
  },

  // ---- Gaming Consoles ----
  {
    owner: 'hamza@rentora.demo', category: 'gaming-consoles', sub: 'Console', featured: true,
    title: 'PlayStation 5 with 2 Controllers',
    description: 'Disc-edition PlayStation 5 with two controllers, HDMI cable and power cable. Perfect for a weekend of gaming with friends.',
    condition: 'Excellent', price: 3000, deposit: 20000, location: 'Johar Town, Lahore',
    specs: [
      { label: 'Console', value: 'PlayStation 5 (disc)' },
      { label: 'Controllers', value: '2' },
      { label: 'Included', value: 'HDMI and power cables' },
    ],
  },
  {
    owner: 'hamza@rentora.demo', category: 'gaming-consoles', sub: 'Console',
    title: 'Xbox Series X Console',
    description: 'Xbox Series X with one controller and cables. Games are not included unless agreed with the owner.',
    condition: 'Good', price: 2800, deposit: 18000, location: 'Johar Town, Lahore',
    specs: [
      { label: 'Console', value: 'Xbox Series X' },
      { label: 'Storage', value: '1 TB' },
      { label: 'Controllers', value: '1' },
    ],
  },
  {
    owner: 'ayesha@rentora.demo', category: 'gaming-consoles', sub: 'Controllers',
    title: 'Wireless Controller Pack (2 Controllers)',
    description: 'Two wireless controllers with charging cable. Useful for adding a second or third player to your own console.',
    condition: 'Good', price: 600, deposit: 3000, location: 'Bahria Town, Lahore',
    specs: [{ label: 'Quantity', value: '2 controllers' }, { label: 'Included', value: 'Charging cable' }],
  },
  {
    owner: 'usman@rentora.demo', category: 'gaming-consoles', sub: 'VR headsets',
    title: 'Standalone VR Headset',
    description: 'Wireless VR headset with two controllers. Good for demos, events and trying VR before buying.',
    condition: 'Excellent', price: 2200, deposit: 15000, location: 'DHA Phase 6, Lahore',
    specs: [{ label: 'Type', value: 'Standalone VR headset' }, { label: 'Controllers', value: '2' }],
  },

  // ---- Bikes & Cycles ----
  {
    owner: 'usman@rentora.demo', category: 'bikes-cycles', sub: 'Mountain bikes', featured: true,
    title: 'Mountain Bike — 21 Speed',
    description: 'Sturdy 21-speed mountain bike with front suspension. Suitable for rides around the city and light trails. Helmet available on request.',
    condition: 'Good', price: 900, deposit: 5000, location: 'Cantt, Lahore',
    specs: [{ label: 'Gears', value: '21 speed' }, { label: 'Type', value: 'Mountain bike' }, { label: 'Frame', value: 'Medium' }],
  },
  {
    owner: 'owner@rentora.demo', category: 'bikes-cycles', sub: 'Road bikes',
    title: 'Lightweight Road Bike',
    description: 'Smooth, fast road bike for long rides and weekend cycling groups.',
    condition: 'Good', price: 1100, deposit: 7000, location: 'DHA Phase 5, Lahore',
    specs: [{ label: 'Type', value: 'Road bike' }, { label: 'Frame', value: 'Large' }],
  },
  {
    owner: 'zainab@rentora.demo', category: 'bikes-cycles', sub: 'City bikes',
    title: 'Folding City Bike',
    description: 'Easy-to-carry folding bike for short trips and commuting. Folds quickly and fits in a car boot.',
    condition: 'Excellent', price: 700, deposit: 4000, location: 'Garden Town, Lahore',
    specs: [{ label: 'Type', value: 'Folding bike' }, { label: 'Gears', value: '6 speed' }],
  },

  // ---- Electronics & Equipment ----
  {
    owner: 'ayesha@rentora.demo', category: 'electronics-equipment', sub: 'Projectors', featured: true,
    title: 'Full HD Projector (XGimi)',
    description: 'Bright Full HD projector for movie nights, presentations and events. Includes remote, power cable and HDMI cable.',
    condition: 'Excellent', price: 1800, deposit: 10000, location: 'Faisal Town, Lahore',
    specs: [{ label: 'Resolution', value: 'Full HD (1080p)' }, { label: 'Included', value: 'Remote, power and HDMI cables' }],
  },
  {
    owner: 'ayesha@rentora.demo', category: 'electronics-equipment', sub: 'Speakers',
    title: 'Portable Bluetooth Party Speaker',
    description: 'Loud, portable Bluetooth speaker with a long battery life — good for gatherings and outdoor events.',
    condition: 'Good', price: 1200, deposit: 6000, location: 'Garden Town, Lahore',
    specs: [{ label: 'Connectivity', value: 'Bluetooth' }, { label: 'Included', value: 'Charging cable' }],
  },
  {
    owner: 'owner@rentora.demo', category: 'electronics-equipment', sub: 'Laptops',
    title: 'ThinkPad Laptop (Core i7)',
    description: 'Reliable business laptop for presentations, coding or video editing on a deadline. Charger included.',
    condition: 'Good', price: 2000, deposit: 12000, location: 'Gulberg, Lahore',
    specs: [{ label: 'Processor', value: 'Intel Core i7' }, { label: 'Included', value: 'Charger' }],
  },
  {
    owner: 'bilal@rentora.demo', category: 'electronics-equipment', sub: 'Tablets',
    title: 'Android Tablet — 10 inch',
    description: 'Large-screen tablet for reading, drawing and travel entertainment. Comes with charger and a protective case.',
    condition: 'Good', price: 900, deposit: 5000, location: 'Model Town, Lahore',
    specs: [{ label: 'Screen', value: '10 inch' }, { label: 'Included', value: 'Charger, case' }],
  },
  {
    owner: 'hamza@rentora.demo', category: 'electronics-equipment', sub: 'Microphones',
    title: 'Wireless Microphone Set',
    description: 'Two wireless microphones with receiver — good for events, interviews and presentations.',
    condition: 'Excellent', price: 800, deposit: 4000, location: 'Johar Town, Lahore',
    specs: [{ label: 'Quantity', value: '2 microphones + receiver' }],
  },
  {
    owner: 'ayesha@rentora.demo', category: 'electronics-equipment', sub: 'Projectors',
    title: 'Portable Projector Screen',
    description: 'Foldable 100-inch projector screen with stand. Awaiting moderator review.',
    condition: 'Good', price: 500, deposit: 2500, location: 'Faisal Town, Lahore',
    specs: [{ label: 'Size', value: '100 inch' }], status: 'pending',
  },
];

const reviewPool: { rating: number; comment: string }[] = [
  { rating: 5, comment: 'Exactly as described and in great condition. Pickup was quick and easy.' },
  { rating: 5, comment: 'The owner was friendly and flexible with timing. Would rent again.' },
  { rating: 5, comment: 'Worked perfectly for my project. Highly recommended.' },
  { rating: 5, comment: 'Clean, well looked after and ready to use. Smooth handover.' },
  { rating: 4, comment: 'Good condition overall. Pickup took a little longer than planned, but all fine.' },
  { rating: 4, comment: 'Did the job well. Minor cosmetic wear that did not affect use.' },
  { rating: 4, comment: 'Great value for a short rental. Clear communication from the owner.' },
  { rating: 3, comment: 'Fine for the price, though a couple of accessories needed a quick check at pickup.' },
];

/** Small deterministic random generator so a reset always produces the same demo data. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedDatabase(db: Database.Database) {
  const random = rng(2026);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
  const today = todayISO();
  const nowIso = new Date().toISOString();
  const daysAgoIso = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

  const run = db.transaction(() => {
    // ---- users ----
    const passwordHash = hashPassword(DEMO_PASSWORD);
    const userId: Record<string, number> = {};
    const insertUser = db.prepare(
      'INSERT INTO users (name, email, password_hash, role, email_verified_demo, phone_verified_demo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    users.forEach((u, i) => {
      userId[u.email] = Number(insertUser.run(u.name, u.email, passwordHash, u.role, u.ev, u.pv, daysAgoIso(300 - i * 25)).lastInsertRowid);
    });

    // ---- categories ----
    const categoryId: Record<string, number> = {};
    const insertCategory = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
    for (const c of [...categories, ...marketCategories]) categoryId[c.slug] = Number(insertCategory.run(c.name, c.slug, c.description).lastInsertRowid);

    // ---- listings (+ demo promotions for featured ones) ----
    const insertListing = db.prepare(`
      INSERT INTO listings (owner_id, category_id, title, subcategory, description, item_condition, daily_price,
                            deposit_amount, location_text, specs, status, featured_until, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertPromotion = db.prepare('INSERT INTO demo_promotions (listing_id, plan_name, start_at, end_at) VALUES (?, ?, ?, ?)');
    const featuredEnd = new Date(Date.now() + 25 * 86_400_000).toISOString();
    const listingId: Record<string, number> = {};
    const listingRows: { id: number; seed: SeedListing }[] = [];

    listings.forEach((l, i) => {
      const created = daysAgoIso(120 - i * 4);
      const id = Number(
        insertListing.run(
          userId[l.owner], categoryId[l.category], l.title, l.sub, l.description, l.condition, l.price, l.deposit,
          l.location, JSON.stringify(l.specs), l.status ?? 'approved', l.featured ? featuredEnd : null, created, created,
        ).lastInsertRowid,
      );
      listingId[l.title] = id;
      listingRows.push({ id, seed: l });
      if (l.featured) insertPromotion.run(id, 'Featured · 30 days (demo)', daysAgoIso(5), featuredEnd);
    });

    // ---- bookings, status history, reviews ----
    const insertBooking = db.prepare(`
      INSERT INTO bookings (listing_id, renter_id, owner_id, start_date, end_date, rental_days, daily_price_snapshot,
                            rental_total, deposit_snapshot, status, demo_payment_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertHistory = db.prepare('INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, created_at) VALUES (?, ?, ?, ?, ?)');
    const insertReview = db.prepare('INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)');

    const addBooking = (l: { id: number; seed: SeedListing }, renterEmail: string, start: string, end: string, status: string, payment?: 'none' | 'confirmed') => {
      const days = rentalDays(start, end);
      const ownerId = userId[l.seed.owner];
      const renterId = userId[renterEmail];
      // Requested 5 days before the start, but never in the future (upcoming bookings were requested yesterday).
      const createdAt = new Date(Math.min(Date.parse(`${start}T09:00:00Z`) - 5 * 86_400_000, Date.now() - 86_400_000)).toISOString();
      const id = Number(
        insertBooking.run(l.id, renterId, ownerId, start, end, days, l.seed.price, days * l.seed.price, l.seed.deposit, status,
          payment ?? (status === 'approved' || status === 'completed' ? 'confirmed' : 'none'), createdAt).lastInsertRowid,
      );
      insertHistory.run(id, null, 'pending', renterId, createdAt);
      if (status === 'approved' || status === 'completed') insertHistory.run(id, 'pending', 'approved', ownerId, createdAt);
      if (status === 'completed') insertHistory.run(id, 'approved', 'completed', ownerId, new Date(Date.parse(`${end}T18:00:00Z`)).toISOString());
      return { id, renterId, ownerId, end };
    };

    const renters = users.filter((u) => u.role === 'user').map((u) => u.email);

    for (const l of listingRows) {
      if (l.seed.status === 'pending') continue;
      const count = l.seed.featured ? 3 + Math.floor(random() * 2) : 1 + Math.floor(random() * 3);
      const eligible = renters.filter((e) => e !== l.seed.owner);
      for (let k = 0; k < count; k++) {
        const start = addDays(today, -(14 + k * 17 + Math.floor(random() * 6)));
        const end = addDays(start, Math.floor(random() * 3));
        const booking = addBooking(l, pick(eligible), start, end, 'completed');
        const review = pick(reviewPool);
        insertReview.run(booking.id, booking.renterId, booking.ownerId, review.rating, review.comment,
          new Date(Date.parse(`${end}T20:00:00Z`) + 86_400_000).toISOString());
      }
    }

    // Upcoming approved bookings (these dates show as unavailable in the calendar)
    const byTitle = (t: string) => listingRows.find((l) => l.seed.title === t)!;
    const sony = byTitle('Sony A7 III Mirrorless Camera');
    const ps5 = byTitle('PlayStation 5 with 2 Controllers');
    const projector = byTitle('Full HD Projector (XGimi)');
    const mtb = byTitle('Mountain Bike — 21 Speed');
    const sonyApproved = addBooking(sony, 'hamza@rentora.demo', addDays(today, 5), addDays(today, 7), 'approved');
    const ps5Approved = addBooking(ps5, 'renter@rentora.demo', addDays(today, 9), addDays(today, 10), 'approved', 'none');
    addBooking(projector, 'bilal@rentora.demo', addDays(today, 3), addDays(today, 3), 'approved');
    addBooking(mtb, 'zainab@rentora.demo', addDays(today, 11), addDays(today, 14), 'approved');
    // Completed rentals with no review yet, so the review flow can be shown live (Batch 5):
    //   Sara (renter@) can review the owner, and the owner can review Sara back.
    const canon = byTitle('Canon EOS R6 Body');
    addBooking(canon, 'renter@rentora.demo', addDays(today, -9), addDays(today, -7), 'completed');
    // A pending request for the demo owner to act on (Batch 3)
    const sonyPending = addBooking(sony, 'renter@rentora.demo', addDays(today, 14), addDays(today, 16), 'pending');

    // ---- notifications, favourites, reports ----
    const insertNote = db.prepare('INSERT INTO notifications (user_id, title, body, is_read, link, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    insertNote.run(userId['owner@rentora.demo'], 'New booking request', 'Sara Malik requested the Sony A7 III Mirrorless Camera for the next two weeks.', 0, `/bookings/${sonyPending.id}`, nowIso);
    insertNote.run(userId['owner@rentora.demo'], 'Booking approved', 'You approved Hamza Ali’s request for the Sony A7 III Mirrorless Camera.', 1, `/bookings/${sonyApproved.id}`, daysAgoIso(2));
    insertNote.run(userId['renter@rentora.demo'], 'Request approved', 'Hamza Ali approved your request for the PlayStation 5. Confirm the demo payment to finish.', 0, `/bookings/${ps5Approved.id}`, nowIso);

    const insertFav = db.prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)');
    for (const t of ['Sony A7 III Mirrorless Camera', 'Canon EOS R6 Body', 'PlayStation 5 with 2 Controllers']) {
      insertFav.run(userId['renter@rentora.demo'], listingId[t]);
    }

    db.prepare('INSERT INTO reports (listing_id, reporter_id, reason) VALUES (?, ?, ?)').run(
      listingId['Portable Bluetooth Party Speaker'], userId['renter@rentora.demo'],
      'Sample report: the description does not clearly state the speaker’s brand or battery life.',
    );
    db.prepare('INSERT INTO reports (listing_id, reporter_id, reason) VALUES (?, ?, ?)').run(
      listingId['Mountain Bike — 21 Speed'], userId['hamza@rentora.demo'],
      'Sample report: the pickup area in the listing is very broad. Please ask the owner to be more specific.',
    );

    // ---- extra listings with real photos: furniture, phones, watches, vehicles ----
    seedMarketplace(db, userId, categoryId);
  });

  run();
}
