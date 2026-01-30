const express = require("express");
const router = express.Router();

const Payment = require("../models/Payments");
const Booking = require("../models/Booking");

// ✅ GET /newapi/payments
router.get("/", async (req, res) => {
  try {
    const docs = await Payment.find().sort({ createdAt: -1 });
    res.json(docs.map(d => d.raw));
  } catch (error) {
    console.error("❌ Error fetching payments:", error);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
});

// ✅ POST /newapi/payments
router.post("/", async (req, res) => {
  try {
    const raw = req.body || {};

    const paymentId = raw["Payment ID"] || raw.paymentId;
    const bookingId = raw["Booking ID"] || raw.bookingId;
    const customerName = raw["Customer Name"] || raw.customerName || "";
    const amount = Number(raw.Amount ?? raw.amount ?? 0);
    const paymentMode = raw["Payment Mode"] || raw.paymentMode || "";
    const date = raw.Date || raw.date || "";
    const time = raw.Time || raw.time || "";

    if (!paymentId) {
      return res.status(400).json({ success: false, error: "Payment ID is required" });
    }
    if (!bookingId) {
      return res.status(400).json({ success: false, error: "Booking ID is required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Amount must be > 0" });
    }

    // ✅ store payment (upsert safe)
    await Payment.findOneAndUpdate(
      { paymentId },
      {
        paymentId,
        bookingId,
        customerName,
        amount,
        paymentMode,
        date,
        time,
        raw: {
          ...raw,
          "Payment ID": paymentId,
          "Booking ID": bookingId,
          "Customer Name": customerName,
          Amount: amount,
          "Payment Mode": paymentMode,
          Date: date,
          Time: time
        }
      },
      { upsert: true, new: true }
    );

    // ✅ update booking balance in MongoDB
    const bookingDoc = await Booking.findOne({ bookingId });
    if (bookingDoc) {
      const bookingRaw = { ...(bookingDoc.raw || {}) };

      // booking balance might be "Balance" or "Balance Due" etc. We use Balance
      const currentBalance = Number(bookingRaw.Balance ?? bookingDoc.balance ?? 0);
      const newBalance = currentBalance - amount;

      bookingRaw.Balance = newBalance; // keep excel style

      await Booking.updateOne(
        { bookingId },
        { $set: { balance: newBalance, raw: bookingRaw } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error adding payment:", error);
    res.status(500).json({ success: false, error: "Failed to add payment" });
  }
});

// ✅ DELETE /newapi/payments/:id   (id = PAY0001)
router.delete("/:id", async (req, res) => {
  try {
    const paymentId = req.params.id;

    const paymentDoc = await Payment.findOne({ paymentId });
    if (!paymentDoc) return res.status(404).json({ success: false, error: "Payment not found" });

    // Optional: if you delete a payment, you may want to add back amount to booking balance
    // (Your old code did NOT do it, so we keep same behavior)

    await Payment.deleteOne({ paymentId });

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting payment:", error);
    res.status(500).json({ success: false, error: "Failed to delete payment" });
  }
});

module.exports = router;
