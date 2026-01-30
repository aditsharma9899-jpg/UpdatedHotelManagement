const router = require("express").Router();
const Booking = require("../models/Booking");

// ✅ GET all bookings
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ CREATE booking
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    console.log('whole booking data',body)

    if (!body.customerName || !body.mobile) {
      return res.status(400).json({
        success: false,
        error: "customerName and mobile are required"
      });
    }

    if (!body.bookingId) {
      return res.status(400).json({
        success: false,
        error: "bookingId is required"
      });
    }

    const saved = await Booking.create(body);
    res.status(201).json({ success: true, booking: saved });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
