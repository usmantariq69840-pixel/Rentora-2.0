# Rentora — Rent. Share. Earn.

Peer-to-peer rental marketplace website (university project, local-only).
React + TypeScript + Vite frontend, Express + TypeScript backend, SQLite database (from Batch 2), Gemini AI (from Batch 4).

## Run it locally

Requires Node.js 22 or newer (the SQLite driver `better-sqlite3` installs a prebuilt binary for it).

```bash
npm install            # installs client + server (npm workspaces)
cp server/.env.example server/.env   # Windows: copy server\.env.example server\.env
npm run dev            # starts both servers
```

- Website: http://localhost:5173
- API: http://localhost:3001  (health check: http://localhost:5173/api/health)

The browser only talks to Vite; Vite forwards `/api` to Express. The Gemini key never reaches the browser. Add it in the app (see **AI features**) or in `server/.env`.

### Database and demo data

The SQLite file is `server/data/rentora.db`. It is created and filled with demo data automatically the first time the server starts.
To restore the known demo dataset at any time (for example before a presentation):

```bash
npm run db:reset -w server
```

Demo accounts (the sign-in page also has one-click buttons for them):

| Account | Role |
|---|---|
| `owner@rentora.demo` (Ahmed Khan) | Owns several listings and has a pending booking request waiting for a reply |
| `renter@rentora.demo` (Sara Malik) | Has sent requests, saved items, and an approved booking waiting for the demo payment |
| `admin@rentora.demo` | Moderator: review queue, reports, users, and the Gemini key |

Other seeded users (`hamza@`, `ayesha@`, `usman@`, `bilal@`, `zainab@`, all `@rentora.demo`) own the remaining listings. Anyone can also create an account on `/register`.

All demo accounts share one password: `Rentora@2026`. Demo only — never reuse a real password.

### API

| Route | Purpose |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/categories` | Seven categories with item counts |
| `GET /api/categories/:slug` | Category plus its subcategories |
| `GET /api/items` | Search: `q, category, subcategory, minPrice, maxPrice, sort, from, to, featured, exclude, limit, offset` |
| `GET /api/items/:id` | Detail: photos, specs, owner, reviews, booked dates (owners/admins can also open their own pending listing) |
| `POST /api/auth/register`, `login`, `logout`, `demo-login` | Sessions (HTTP-only cookie). `demo-login` is disabled when `NODE_ENV=production` |
| `GET /api/auth/me`, `PATCH /api/auth/me` | Current user (`null` for guests) and profile edit |
| `GET /api/favorites`, `POST`/`DELETE /api/favorites/:listingId` | Saved items (signed-in users) |
| `POST /api/bookings` | Send a rental request |
| `GET /api/bookings/mine`, `/received`, `/:id` | Requests sent, requests on my listings, one booking (participants only) |
| `PATCH /api/bookings/:id/status` | `approved` / `declined` (owner), `cancelled` (renter), `completed` (owner). Only valid transitions are accepted |
| `POST /api/bookings/:id/demo-payment` | Renter confirms the simulated payment on an approved booking |
| `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` | In-app notifications |
| `GET /api/dashboard` | Owner overview figures and "my listings" |
| `POST /api/items`, `PATCH /api/items/:id` | Create / edit a listing (multipart: JSON in `data` + up to 6 `images`, 5 MB each). New listings start `pending`; owners edit only their own |
| `POST /api/items/:id/archive` | Soft-delete a listing. Refused (409) while it has pending or approved bookings |
| `PATCH /api/admin/listings/:id/status` | Admin: `approved` or `hidden`, with an optional reason sent to the owner. Hiding also ends a featured promotion |
| `GET /api/admin/overview`, `/listings?status=`, `/users`, `/reports?status=`, `PATCH /api/admin/reports/:id` | Admin only: counts, the review queue (`pending`, `approved`, `hidden`), read-only user list, flagged listings |
| `POST /api/items/:id/report` | Signed in: flag a live listing (not your own; one open report each) |
| `POST /api/reviews` | Review a completed booking: renter and owner can each leave one (1–5 stars + optional comment). Only the renter's review counts toward the listing rating |
| `GET /api/promotions/plans`, `GET /api/promotions/mine`, `POST /api/promotions`, `DELETE /api/promotions/:listingId` | Simulated featured plans. Owners start, extend or stop a promotion on their own approved listing. Nothing is charged |
| `GET /api/ai/status` | `{available, canConfigure}`: whether AI is switched on |
| `POST /api/ai/listing-draft` | Signed in. One photo + optional notes → draft title, category, description, tags, details and a "please confirm" list |
| `POST /api/ai/rental-search` | Plain-English request → criteria → real database matches (works without a key in basic mode) |
| `GET`/`PUT`/`DELETE /api/settings/ai`, `POST /api/settings/ai/test` | Admin only: view the masked key, save / replace / delete it, choose the model, test the connection |

### Sign-in and permissions

- Sessions live in the `sessions` table. The browser holds only a random token in an HTTP-only, SameSite=Lax cookie, and the database stores a keyed hash of it (`SESSION_SECRET` in `server/.env`).
- Passwords are hashed with scrypt. Eight failed sign-ins for one email from one address within ten minutes are temporarily blocked.
- The server enforces every rule itself (the React route guards are only a convenience): you must be signed in to save, book or open bookings; only the owner can approve, decline or complete; only the renter can cancel a pending request or confirm the demo payment; only the two participants can open a booking.
- Booking rules: dates can't be in the past, the end can't precede the start, a rental is at most 30 days, you can't book your own item, approved bookings can't overlap, and a pending request that overlaps a newly approved booking can no longer be approved. Price and deposit are copied onto the booking when it is requested.
- "Mark as returned" can be used at any time after approval, so the demo flow can be shown without waiting for real dates.

### Rental date rule

Dates are calendar days and **inclusive**: 25 Apr → 27 Apr is 3 rental days. The end date may equal the start date (a one-day rental) but never precede it. Two bookings overlap if they share any day. The same rule is implemented in `server/src/lib/dates.ts` and `client/src/lib/dates.ts`.

## AI features (Gemini)

Both AI features call Gemini **from the server only**.

**Adding, replacing and deleting the key (no file editing needed)**
1. Sign in as `admin@rentora.demo` → account menu → **AI settings** (`/settings/ai`).
2. Paste the key and press **Save and test key**. **Replace key**, **Delete saved key**, **Test connection** and the model name are on the same page.
3. If a signed-in admin uses an AI feature while no key is set, a small prompt opens so the key can be pasted right there. Other users are told an administrator can switch AI on.

Get a free key from Google AI Studio (https://aistudio.google.com/apikey).

**How the key is kept**
- Saved keys are encrypted with AES-256-GCM (key derived from `SESSION_SECRET`) in the `app_settings` table. Changing `SESSION_SECRET` makes saved keys unreadable, so just paste the key again.
- The API only ever returns a masked key (`AIza…0000`). It is sent to Google in a request header, never in a URL, and never logged.
- Precedence: key saved in the app → `GEMINI_API_KEY` in `server/.env` → none. A `.env` key can't be deleted from the page; saving another key overrides it.

**What the AI does and doesn't do**
- *Listing Generator* (step 1 of the wizard): sends the cover photo and your notes. It suggests a title, category, description, tags and details, plus things you must confirm. It never sets condition, price, deposit or location. You tick what to use, can undo it, and suggested fields are tagged until you edit them.
- *Rental Finder*: Gemini only turns the sentence into filters. Matching, availability and price estimates come from the SQLite database, so results are always real listings. With no key (or if Gemini is down) a simple keyword reader is used and the page says so.
- Rate limits: 15 drafts and 30 searches per 10 minutes.

**Not tested live in the build environment.** The automated tests ran against a local stand-in for the Gemini API. Your first real check is **Test connection** on the AI settings page. If Google retires the default model name `gemini-flash-latest`, change it on the same page.

## Presenting

`DEMO_SCRIPT.md` has a step-by-step 5–7 minute script, the exact AI prompt to use, and what to do if something fails. Reset the data with `npm run db:reset -w server` before presenting.

## Build progress

| Batch | Contents | Status |
|---|---|---|
| 1 | Setup, design system, shared components, header/footer, animated home page, API skeleton | Done |
| 2 | SQLite schema + seed/reset, categories & items API, Browse / Category / Item detail pages, availability calendar | Done |
| 3 | Demo auth + sessions, saved items, booking workflow, notifications, owner dashboard, profile | Done |
| 4 | Listing wizard + image upload, AI Listing Generator, AI Rental Finder, in-app Gemini key manager | Done |
| 5 | Admin moderation, reviews, featured-listing demo, final polish, demo script | Done |

## Project structure

```
client/src/
  app/          App + router (every planned route already exists)
  components/   common/ (Button, Input, Modal, Toast, ...), layout/, listings/
  pages/        Home, Admin (admin/), Browse, ItemDetail, auth/ (Login, Register), Bookings, BookingDetail, Dashboard, Profile, Saved, DemoInfo, listing wizard (ListingWizard + listing/), AiFinder, settings/AiSettings
  hooks/        useApi, useListings, useReveal, useScrolled, useTypewriter, ...
  lib/          api.ts, format.ts, dates.ts, art.ts, AuthContext, SavedContext, NotificationsContext, bookings.ts
  styles/       tokens.css (colours, type, spacing, motion), global.css, animations.css
server/src/
  app.ts, index.ts, config.ts
  database/     schema.sql, connection.ts, seed.ts, seedMarketplace.ts (29 listings with photos)
  seed-images/  (in server/) photos for the seeded listings, copied to uploads on every reset
  routes/       health, categories, items, auth, favorites, bookings, notifications, dashboard, ai, settings, admin
  middleware/   auth.ts (sessions, requireAuth, requireAdmin), errorHandler.ts
  services/     ai/ (gemini, listing draft, rental search), settings/, admin/, reviews/, promotions/, listings/, bookings/ (workflow + overlap checks), notifications/, users/, dashboard/
  validation/   Zod schemas for query strings and params
  lib/          password hashing, sessions, rate limiting, date rules
  scripts/      reset.ts (npm run db:reset)
```

## Testing

There is no test runner in the repo. During development every batch was checked with scripted API tests (permissions, validation, booking/overlap rules, review eligibility, admin-only routes, AI errors against a stand-in Gemini) and browser tests, plus a sweep of every page at 1440, 1280, 1024, 768, 390 and 360 px for horizontal overflow, console errors and broken links. For your own checks, follow the plan's checklist in section 15 of the project plan.

## Design notes

- All colours, spacing, radii and motion timings are CSS variables in `client/src/styles/tokens.css`.
- Animations respect `prefers-reduced-motion`.
- Product photos: uploaded in the listing wizard and stored in `server/uploads/listings/` (type checked by file signature, random file names, served from `/uploads`). Listings without a photo show a built-in illustration. The seeded furniture, phones, watches and vehicles use the photos in `server/seed-images/`, which are copied into the uploads folder whenever the database is seeded.
- After pulling new seed data, run `npm run db:reset -w server` once so the new listings appear in an existing database.
- Listing approval: new listings are `pending` and visible only to the owner and admins. An admin approves or hides them from **Admin moderation** (or the banner on the listing page).
- Reviews: after a rental is marked returned, the renter and the owner can each leave one review on the booking page. The renter's review appears on the listing and counts toward its rating.
- Featured (demo): owners can feature an approved listing for 7 or 30 days from **Dashboard → Featured (demo)**. It is a simulation, no payment is asked for. Featured listings get a label and are ranked first.
- Payments, deposits and verification are simulated everywhere.
