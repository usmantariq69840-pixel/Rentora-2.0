import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { changeStatus, confirmDemoPayment, createBooking, getBookingDetail, listBookings } from '../services/bookings/bookingService.js';
import { createBookingSchema, statusSchema } from '../validation/bookings.js';
import { idParamSchema } from '../validation/items.js';

const router = Router();
router.use(requireAuth); // every booking route needs a signed-in user

// POST /api/bookings — send a rental request
router.post('/', (req, res) => {
  const body = createBookingSchema.parse(req.body);
  res.status(201).json({ booking: createBooking(req.user!, body) });
});

// GET /api/bookings/mine — requests I sent as a renter
router.get('/mine', (req, res) => {
  res.json({ bookings: listBookings(req.user!, 'renter') });
});

// GET /api/bookings/received — requests on my listings
router.get('/received', (req, res) => {
  res.json({ bookings: listBookings(req.user!, 'owner') });
});

// GET /api/bookings/:id — participants only
router.get('/:id', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ booking: getBookingDetail(req.user!, id) });
});

// PATCH /api/bookings/:id/status — approve / decline / cancel / complete (validated transitions only)
router.patch('/:id/status', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const { status } = statusSchema.parse(req.body);
  res.json({ booking: changeStatus(req.user!, id, status) });
});

// POST /api/bookings/:id/demo-payment — simulated payment confirmation
router.post('/:id/demo-payment', (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json({ booking: confirmDemoPayment(req.user!, id) });
});

export default router;
