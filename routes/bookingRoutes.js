const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Room = require("../models/Rooms")

/* ------------------ Helpers ------------------ */

function parseRoomNumbers(roomNumberStr) {
  if (!roomNumberStr || typeof roomNumberStr !== "string") return [];
  if (roomNumberStr.includes("TBD")) return [];
  return roomNumberStr.split(",").map(s => s.trim()).filter(Boolean);
}

function computeAmounts(raw) {
  const nights = parseInt(raw.Nights || raw.nights) || 1;
  const roomPricePerNight =
    parseInt(raw["Room Price Per Night"] || raw.roomPricePerNight) || 0;

  const roomAmount = roomPricePerNight * nights;
  const additionalAmount =
    parseInt(raw["Additional Amount"] || raw.additionalAmount) || 0;

  const totalAmount = roomAmount + additionalAmount;
  const advance = parseInt(raw.Advance || raw.advance) || 0;
  const balance = totalAmount - advance;

  // write back in excel style keys (frontend compatibility)
  raw.Nights = nights;
  raw["Room Price Per Night"] = roomPricePerNight;
  raw["Room Amount"] = roomAmount;
  raw["Additional Amount"] = additionalAmount;
  raw["Total Amount"] = totalAmount;
  raw.Advance = advance;
  raw.Balance = balance;

  return { nights, roomPricePerNight, roomAmount, additionalAmount, totalAmount, advance, balance };
}

/* ------------------ GET ALL (optional but useful) ------------------ */
router.get("/", async (req, res) => {
  try {
    const docs = await Booking.find().sort({ createdAt: -1 });
    res.json(docs.map(d => d.raw));
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch bookings" });
  }
});

/* ------------------ POST CREATE (from previous message) ------------------ */
router.post("/", async (req, res) => {
  try {
    console.log('whole body data is',req.body);
    const raw = req.body || {};

    const { nights, roomPricePerNight, additionalAmount, roomAmount, totalAmount, advance, balance } =
      computeAmounts(raw);

    const bookingId = raw["Booking ID"] || raw.bookingId || "";
    const customerName = raw["Customer Name"] || raw.customerName || "";
    const mobile = raw["Mobile"] || raw.mobile || "";

    const roomNumbers = Array.isArray(req.body.rooms)
  ? req.body.rooms.map(r => String(r.number)).filter(Boolean)
  : [];

console.log("➡️ Rooms to occupy:", roomNumbers);

    const created = await Booking.create({
      bookingId,
      customerName,
      mobile,
      roomNumbers,
      status: raw.Status || raw.status || "",
      checkIn: raw["Check In"] || raw.checkIn || "",
      checkOut: raw["Check Out"] || raw.checkOut || "",
      nights,
      roomPricePerNight,
      additionalAmount,
      roomAmount,
      totalAmount,
      advance,
      balance,
      raw
    });

    // roomNumbers from mongoBookingData


if (roomNumbers.length > 0) {
  const updateResult = await Room.updateMany(
    { roomNumber: { $in: roomNumbers } },
    { $set: { status: "occupied" } }
  );

  console.log("✅ Room update result:", updateResult);
}


    if (roomNumbers.length > 0) {
      await Room.updateMany(
        { roomNumber: { $in: roomNumbers } },
        { $set: { status: "occupied" } }
      );
    }

    res.json({ success: true, booking: created.raw });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    res.status(500).json({ success: false, error: "Failed to create booking" });
  }
});

/* ------------------ PUT UPDATE BOOKING ------------------ */
// ✅ PUT /newapi/bookings/:id   (id = BK0001)
router.put("/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updatedRaw = req.body || {};

    // find existing booking
    const existing = await Booking.findOne({ bookingId });
    if (!existing) return res.status(404).json({ success: false, error: "Booking not found" });

    // compute totals again
    const computed = computeAmounts(updatedRaw);

    // rooms change handling
    const oldRoomStr = existing.raw?.["Room Number"] || existing.raw?.roomNumber || "TBD";
    const newRoomStr = updatedRaw["Room Number"] || updatedRaw.roomNumber || "TBD";

    const oldRooms = parseRoomNumbers(oldRoomStr);
    const newRooms = parseRoomNumbers(newRoomStr);

    const roomChanged = oldRoomStr !== newRoomStr;

    if (roomChanged) {
      // free old rooms
      if (oldRooms.length > 0) {
        await Room.updateMany(
          { roomNumber: { $in: oldRooms } },
          { $set: { status: "available" } }
        );
      }
      // occupy new rooms
      if (newRooms.length > 0) {
        await Room.updateMany(
          { roomNumber: { $in: newRooms } },
          { $set: { status: "occupied" } }
        );
      }
    }

    // update booking doc
    const saved = await Booking.findOneAndUpdate(
      { bookingId },
      {
        customerName: updatedRaw["Customer Name"] || updatedRaw.customerName || existing.customerName,
        mobile: updatedRaw["Mobile"] || updatedRaw.mobile || existing.mobile,
        roomNumbers: newRooms,
        status: updatedRaw.Status || updatedRaw.status || existing.status,
        checkIn: updatedRaw["Check In"] || updatedRaw.checkIn || existing.checkIn,
        checkOut: updatedRaw["Check Out"] || updatedRaw.checkOut || existing.checkOut,
        nights: computed.nights,
        roomPricePerNight: computed.roomPricePerNight,
        additionalAmount: computed.additionalAmount,
        roomAmount: computed.roomAmount,
        totalAmount: computed.totalAmount,
        advance: computed.advance,
        balance: computed.balance,
        raw: updatedRaw
      },
      { new: true }
    );

    res.json({ success: true, booking: saved.raw });
  } catch (error) {
    console.error("❌ Error updating booking:", error);
    res.status(500).json({ success: false, error: "Failed to update booking" });
  }
});

/* ------------------ ALLOCATE ROOM TO ADVANCE BOOKING ------------------ */
// ✅ POST /newapi/bookings/:id/allocate-room
// body: { roomNumbers: "101, 102" }
router.post("/:id/allocate-room", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const roomNumbersStr = req.body?.roomNumbers;

    const bookingDoc = await Booking.findOne({ bookingId });
    if (!bookingDoc) return res.status(404).json({ success: false, error: "Booking not found" });

    const raw = { ...(bookingDoc.raw || {}) };

    if ((raw.Status || raw.status) !== "Advance Booking") {
      return res.status(400).json({ success: false, error: "Not an advance booking" });
    }

    // update raw booking fields
    raw["Room Number"] = roomNumbersStr;
    raw.Status = "Confirmed";

    // recompute (keeps safe)
    const computed = computeAmounts(raw);
    const newRooms = parseRoomNumbers(roomNumbersStr);

    // occupy allocated rooms
    if (newRooms.length > 0) {
      await Room.updateMany(
        { roomNumber: { $in: newRooms } },
        { $set: { status: "occupied" } }
      );
    }

    const saved = await Booking.findOneAndUpdate(
      { bookingId },
      {
        roomNumbers: newRooms,
        status: "Confirmed",
        nights: computed.nights,
        roomPricePerNight: computed.roomPricePerNight,
        additionalAmount: computed.additionalAmount,
        roomAmount: computed.roomAmount,
        totalAmount: computed.totalAmount,
        advance: computed.advance,
        balance: computed.balance,
        raw
      },
      { new: true }
    );

    res.json({ success: true, booking: saved.raw });
  } catch (error) {
    console.error("❌ Error allocating room:", error);
    res.status(500).json({ success: false, error: "Failed to allocate room" });
  }
});

/* ------------------ DELETE BOOKING ------------------ */
// ✅ DELETE /newapi/bookings/:id
router.delete("/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const bookingDoc = await Booking.findOne({ bookingId });
    if (!bookingDoc) return res.status(404).json({ success: false, error: "Booking not found" });

    const roomStr = bookingDoc.raw?.["Room Number"] || bookingDoc.raw?.roomNumber || "TBD";
    const roomNumbers = parseRoomNumbers(roomStr);

    // free rooms
    if (roomNumbers.length > 0) {
      await Room.updateMany(
        { roomNumber: { $in: roomNumbers } },
        { $set: { status: "available" } }
      );
    }

    await Booking.deleteOne({ bookingId });

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting booking:", error);
    res.status(500).json({ success: false, error: "Failed to delete booking" });
  }
});

/* ------------------ CHECKOUT ------------------ */
// ✅ POST /newapi/bookings/:id/checkout
router.post("/:id/checkout", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const bookingDoc = await Booking.findOne({ bookingId });
    if (!bookingDoc) return res.status(404).json({ success: false, error: "Booking not found" });

    const raw = { ...(bookingDoc.raw || {}) };

    const checkoutTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit"
    });

    raw["Check Out Time"] = checkoutTime;
    raw.Status = "Checked Out";

    // free rooms
    const roomStr = raw["Room Number"] || raw.roomNumber || "TBD";
    const roomNumbers = parseRoomNumbers(roomStr);

    if (roomNumbers.length > 0) {
      await Room.updateMany(
        { roomNumber: { $in: roomNumbers } },
        { $set: { status: "available" } }
      );
    }

    const saved = await Booking.findOneAndUpdate(
      { bookingId },
      { status: "Checked Out", roomNumbers: [], raw },
      { new: true }
    );

    res.json({ success: true, checkoutTime, booking: saved.raw });
  } catch (error) {
    console.error("❌ Error during checkout:", error);
    res.status(500).json({ success: false, error: "Failed to checkout" });
  }
});

module.exports = router;
