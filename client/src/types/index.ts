export type CategorySlug =
  | 'cameras-photography'
  | 'gaming-consoles'
  | 'bikes-cycles'
  | 'electronics-equipment'
  | 'furniture-appliances'
  | 'watches-accessories'
  | 'vehicles';

/** Which built-in illustration to draw when a listing has no photo. */
export type ArtKind =
  | 'camera'
  | 'actioncam'
  | 'console'
  | 'controller'
  | 'bike'
  | 'projector'
  | 'laptop'
  | 'speaker'
  | 'sofa'
  | 'watch'
  | 'car';

export interface Category {
  id: number;
  name: string;
  slug: CategorySlug;
  description: string;
  itemCount: number;
}

export interface Subcategory {
  name: string;
  count: number;
}

export interface CategoryDetail extends Category {
  subcategories: Subcategory[];
}

/** A listing as shown on cards and in search results. Mirrors the API response. */
export interface Listing {
  id: number;
  title: string;
  subcategory: string | null;
  categorySlug: CategorySlug;
  categoryName: string;
  /** PKR per day */
  dailyPrice: number;
  /** Refundable deposit (illustrative only) */
  depositAmount: number;
  condition: string;
  location: string;
  /** Average of real reviews, or null when there are none yet */
  rating: number | null;
  reviewCount: number;
  featured: boolean;
  ownerId: number;
  ownerName: string;
  /** Cover photo URL. When missing, an illustration is drawn instead. */
  imageUrl?: string;
}

export interface ListingDetail extends Listing {
  status: 'pending' | 'approved' | 'hidden' | 'archived';
  description: string;
  createdAt: string;
  availabilityNote: string | null;
  tags: string[];
  specs: { label: string; value: string }[];
  images: { id: number; url: string; isCover: boolean }[];
  owner: {
    id: number;
    name: string;
    emailVerifiedDemo: boolean;
    phoneVerifiedDemo: boolean;
    memberSince: string;
    listingCount: number;
  };
  reviews: { id: number; rating: number; comment: string | null; createdAt: string; reviewerName: string }[];
  ratingBreakdown: { stars: number; count: number }[];
  /** Inclusive date ranges that already have an approved booking */
  unavailable: { start: string; end: string }[];
}

export interface ItemsResponse {
  items: Listing[];
  total: number;
  limit: number;
  offset: number;
}

export type SortKey = 'recommended' | 'rating' | 'price_asc' | 'price_desc';

/** Filters shared by the Browse and Category pages. They live in the URL. */
export interface Filters {
  q: string;
  category: CategorySlug | '';
  subcategory: string;
  minPrice: string;
  maxPrice: string;
  sort: SortKey;
  from: string;
  to: string;
}

// ---------- accounts, bookings, notifications (Batch 3) ----------

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone: string | null;
  emailVerifiedDemo: boolean;
  phoneVerifiedDemo: boolean;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'completed';
/** What the signed-in person may do next; the server decides and the UI only shows what it is told. */
export type BookingAction = 'approve' | 'decline' | 'cancel' | 'complete' | 'pay';

export interface Booking {
  id: number;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  rentalDays: number;
  /** Price per day at the time of booking (later listing edits don't change it) */
  dailyPrice: number;
  rentalTotal: number;
  deposit: number;
  paymentStatus: 'none' | 'confirmed';
  createdAt: string;
  /** A pending request that now overlaps an approved booking */
  conflict: boolean;
  /** Which side the signed-in person is on */
  role: 'renter' | 'owner';
  actions: BookingAction[];
  listing: {
    id: number;
    title: string;
    categorySlug: CategorySlug;
    subcategory: string | null;
    location: string;
    imageUrl?: string;
  };
  renter: { id: number; name: string };
  owner: { id: number; name: string };
}

export interface BookingPerson {
  id: number;
  name: string;
  emailVerifiedDemo: boolean;
  phoneVerifiedDemo: boolean;
  memberSince: string;
}

export interface ReviewMini {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface BookingDetail extends Omit<Booking, 'renter' | 'owner'> {
  /** Reviews on this booking: `mine` is the signed-in person's, `theirs` the other side's */
  review: { canReview: boolean; mine: ReviewMini | null; theirs: ReviewMini | null };
  renter: BookingPerson;
  owner: BookingPerson;
  history: { status: BookingStatus; at: string; byName: string | null }[];
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface OwnerListing extends Listing {
  status: 'pending' | 'approved' | 'hidden' | 'archived';
  createdAt: string;
  /** Approved + completed bookings */
  bookingCount: number;
  /** End of the demo promotion, or null when not featured */
  featuredUntil: string | null;
}

export interface DashboardData {
  stats: {
    listings: number;
    liveListings: number;
    pendingListings: number;
    pendingRequests: number;
    upcomingRentals: number;
    completedRentals: number;
    demoEarnings: number;
  };
  listings: OwnerListing[];
}

// ---------- AI features and listing wizard (Batch 4) ----------

export type AiErrorCode =
  | 'not_configured'
  | 'invalid_key'
  | 'rate_limited'
  | 'timeout'
  | 'offline'
  | 'unavailable'
  | 'model_not_found'
  | 'blocked'
  | 'bad_output'
  | 'bad_request';

/** Whether the AI features have a key to use. Never contains the key. */
export interface AiStatus {
  available: boolean;
  canConfigure: boolean;
}

/** Admin-only view of the saved key. The key itself is masked. */
export interface AiSettings {
  configured: boolean;
  source: 'saved' | 'env' | 'none';
  maskedKey: string | null;
  savedKeyUnreadable: boolean;
  envKeyPresent: boolean;
  model: string;
  defaultModel: string;
  updatedAt: string | null;
}

export interface AiTestResult {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  code?: AiErrorCode;
  message?: string;
}

export interface ListingDraft {
  title: string;
  description: string;
  categorySlug: CategorySlug;
  subcategory: string | null;
  tags: string[];
  attributes: { label: string; value: string }[];
  /** Things the AI was unsure about and wants the owner to double-check */
  confirm: string[];
}

export interface FinderCriteria {
  categorySlug: CategorySlug | null;
  subcategory: string | null;
  keywords: string[];
  minDailyPrice: number | null;
  maxDailyPrice: number | null;
  days: number | null;
  startDate: string | null;
  endDate: string | null;
}

export interface FinderResult {
  listing: Listing;
  /** Short reasons built from the listing's real data */
  reasons: string[];
  estimate: { days: number; rentalTotal: number; deposit: number } | null;
}

export interface FinderResponse {
  /** 'basic' = the AI was unavailable, so a simple keyword reader was used instead */
  mode: 'ai' | 'basic';
  aiNotice: { code: AiErrorCode; message: string } | null;
  criteria: FinderCriteria;
  results: FinderResult[];
  total: number;
  hints: string[];
}

// ---------- admin, reviews, featured demo (Batch 5) ----------

export interface AdminOverview {
  pendingListings: number;
  liveListings: number;
  hiddenListings: number;
  openReports: number;
  users: number;
  featuredListings: number;
}

export interface AdminListing {
  id: number;
  title: string;
  description: string;
  condition: string;
  dailyPrice: number;
  depositAmount: number;
  location: string;
  specs: { label: string; value: string }[];
  tags: string[];
  availabilityNote: string | null;
  status: 'pending' | 'approved' | 'hidden';
  categoryName: string;
  categorySlug: CategorySlug;
  subcategory: string | null;
  createdAt: string;
  images: string[];
  openReports: number;
  owner: { id: number; name: string; emailVerifiedDemo: boolean; phoneVerifiedDemo: boolean };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerifiedDemo: boolean;
  phoneVerifiedDemo: boolean;
  memberSince: string;
  listings: number;
  rentalsTaken: number;
  rentalsGiven: number;
}

export interface AdminReport {
  id: number;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: string;
  reporterName: string;
  listing: { id: number; title: string; status: string; ownerName: string };
}

export interface PromotionPlan {
  id: 'week' | 'month';
  name: string;
  days: number;
  demoPrice: number;
}

export interface PromotionsData {
  plans: PromotionPlan[];
  listings: {
    id: number;
    title: string;
    status: 'pending' | 'approved' | 'hidden';
    categorySlug: CategorySlug;
    subcategory: string | null;
    imageUrl?: string;
    featured: boolean;
    featuredUntil: string | null;
  }[];
  history: {
    id: number;
    planName: string;
    startAt: string;
    endAt: string;
    status: 'active' | 'expired' | 'cancelled';
    listingId: number;
    listingTitle: string;
  }[];
}
