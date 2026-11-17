-- Rentora local database schema (SQLite).
-- Safe to run on every start: every statement is IF NOT EXISTS.
-- Dates are stored as ISO text: 'YYYY-MM-DD' for rental dates, full ISO for timestamps.
-- All money is whole Pakistani rupees (PKR).

CREATE TABLE IF NOT EXISTS users (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  email               TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash       TEXT    NOT NULL,
  role                TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone               TEXT,
  email_verified_demo INTEGER NOT NULL DEFAULT 0 CHECK (email_verified_demo IN (0, 1)),
  phone_verified_demo INTEGER NOT NULL DEFAULT 0 CHECK (phone_verified_demo IN (0, 1)),
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image_path  TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id       INTEGER NOT NULL REFERENCES users(id),
  category_id    INTEGER NOT NULL REFERENCES categories(id),
  title          TEXT    NOT NULL,
  subcategory    TEXT,
  description    TEXT    NOT NULL,
  item_condition TEXT    NOT NULL DEFAULT 'Good' CHECK (item_condition IN ('New', 'Like new', 'Excellent', 'Good', 'Fair')),
  daily_price    INTEGER NOT NULL CHECK (daily_price > 0),
  deposit_amount INTEGER NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  location_text  TEXT    NOT NULL,
  specs          TEXT    NOT NULL DEFAULT '[]',          -- JSON: [{ "label": "...", "value": "..." }]
  tags           TEXT    NOT NULL DEFAULT '[]',          -- JSON: ["mirrorless", "4k"]
  availability_note TEXT,                                -- owner's free-text note, e.g. "Weekdays after 5 pm"
  status         TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden', 'archived')),
  featured_until TEXT,                                   -- demo promotion end (ISO), NULL = not featured
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);

CREATE TABLE IF NOT EXISTS listing_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  file_path  TEXT    NOT NULL,
  is_cover   INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_listing ON listing_images(listing_id);

CREATE TABLE IF NOT EXISTS favorites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id           INTEGER NOT NULL REFERENCES listings(id),
  renter_id            INTEGER NOT NULL REFERENCES users(id),
  owner_id             INTEGER NOT NULL REFERENCES users(id),
  start_date           TEXT    NOT NULL,
  end_date             TEXT    NOT NULL,
  rental_days          INTEGER NOT NULL CHECK (rental_days >= 1),
  daily_price_snapshot INTEGER NOT NULL,
  rental_total         INTEGER NOT NULL,
  deposit_snapshot     INTEGER NOT NULL DEFAULT 0,
  status               TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'completed')),
  demo_payment_status  TEXT    NOT NULL DEFAULT 'none' CHECK (demo_payment_status IN ('none', 'confirmed')),
  created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_status ON bookings(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_id);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT    NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id  INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  reviewee_id INTEGER NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (booking_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  link       TEXT,                                       -- app path to open, e.g. /bookings/12
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);

CREATE TABLE IF NOT EXISTS demo_promotions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  plan_name  TEXT    NOT NULL,
  start_at   TEXT    NOT NULL,
  end_at     TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- Sample flagged content for the admin moderation page (Batch 5)
CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  reason      TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Server-side login sessions (Batch 3). The browser only holds an opaque id in an HTTP-only cookie.
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Small key/value settings (Batch 4). Holds the Gemini API key, encrypted, so it can be saved and deleted from the website.
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
