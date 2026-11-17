# Rentora — presentation demo script (5 to 7 minutes)

Follows section 16 of the project plan. Every step below works with the seeded data.

## Before you present (5 minutes, the day before and again just before)

1. **Reset the data:** `npm run db:reset -w server`, then `npm run dev`. Open http://localhost:5173.
2. **Check the AI key:** sign in as `admin@rentora.demo`, account menu → **AI settings** → **Test connection**. It should say "The AI features are ready." If it doesn't, see *If AI fails* below.
3. **Test your exact AI prompts once** (Gemini's wording can vary a little between runs).
4. Have a photo of a camera, bike or console on the desktop for the listing step (JPEG or PNG, under 5 MB).
5. Open three browser windows (or one normal + two private windows) so you can stay signed in as **owner**, **renter** and **admin** at the same time.

All accounts use the password `Rentora@2026`. The sign-in page has one-click buttons.

## The script

| # | Time | Screen | Say and do |
|---|---|---|---|
| 1 | 0:30 | **Home** (`/`) | "Rentora lets people rent useful things nearby instead of buying them, and earn from things they already own." Scroll the hero, the seven categories and the Featured row. |
| 2 | 0:45 | **Browse** (`/browse`) | Search "camera". Set a maximum price of 2,500 and sort by price low to high. Point out the filters and result count. |
| 3 | 0:45 | **Item page** (open *Sony A7 III*) | Gallery, daily rate, refundable deposit (demo), owner, reviews, and the calendar with unavailable days greyed out. "Availability only comes from approved bookings." |
| 4 | 1:00 | **AI Rental Finder** (`/ai-finder`) | Type: *I need a camera for a university photography assignment for two days, preferably under Rs. 2,500 per day.* Show the "what I understood" chips and the matches with reasons. "Gemini only reads the sentence. Every result is a real listing from our database, so it can't invent a product or a price." Open a result. |
| 5 | 1:15 | **Owner: list an item** (window 1, `owner@`) | **List an item**. Upload your photo, type a few notes (for example "Canon camera, 28-70 mm lens, 2 batteries, charger"), press **Generate with AI**. Tick the suggestions, **Use selected suggestions**. "It never sets the price or condition, and it lists what the owner must double-check." Edit the title, choose a condition, set price and deposit, review, tick the confirmation and **Submit for review**. |
| 6 | 0:30 | **Admin: approve** (window 3, `admin@`) | **Admin moderation**. The queue lists the oldest first, so scroll to your new listing (the seeded ones are older). Press **Approve**. Mention Hide with a reason, Reports and Users. |
| 7 | 1:00 | **Booking** (window 2, `renter@`, then window 1) | As the renter open the new listing, pick dates, **Request to rent**. In the owner window open **Dashboard → Booking requests**, **Approve**. Back as the renter: **Confirm demo payment**. "No real money. Payments, deposits and verification are simulated." |
| 8 | 0:45 | **Return and review** | Owner: **Mark as returned**. Renter: open the booking and leave a star review. It appears on the listing. |
| 9 | 0:30 | **Featured (demo)** | Owner **Dashboard → Featured (demo)**: compare the plans, **Feature (demo)** a listing. It now carries the Featured label and moves to the top. |
| 10 | 0:30 | **Wrap-up** | "Local-first prototype: React + TypeScript, Express, SQLite. AI runs only on the backend and the app still works without it." Mention future work: real payments, real verification, hosting. |

Cut steps 6, 8 and 9 first if you are short on time.

## If something goes wrong

- **AI fails or there's no internet.** The wizard keeps everything you typed. Say "the manual form is the fallback" and carry on by typing. The Finder switches to basic keyword matching, and the demo prompt in step 4 still returns the same real listings.
- **Wrong or expired key.** Admin → AI settings → **Replace key**. You can paste a new key during the demo without restarting anything.
- **Demo data got messy.** Stop the server, run `npm run db:reset -w server`, start again.
- **A booking date is rejected.** Dates can't be in the past, a rental is at most 30 days, and approved bookings can't overlap. Pick later dates.
- **Port already in use.** Close the old terminal, or stop whatever is using 3001 or 5173.

## Questions you may be asked

- *Where is the Gemini key stored?* On the server only, encrypted in the local database (or in `server/.env`). The browser never receives it.
- *Can the AI approve or publish a listing?* No. Every AI suggestion is editable, and new listings wait for an admin.
- *Why can't the AI invent products?* It only produces search filters. The listings shown come from SQLite.
- *Is anything real?* No. Payments, deposits, verification and featured plans are simulations and say so on screen.
