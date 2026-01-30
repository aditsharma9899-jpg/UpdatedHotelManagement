const express = require('express');
//import Room from "../models/Room.js";
const Room = require('../models/Rooms.js')

const router = express.Router();

// GET all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const rooms = req.body; // array of rooms

    for (const r of rooms) {
      if (!r["Room Number"]) continue;

      await Room.updateOne(
        { roomNumber: String(r["Room Number"]) },
        {
          $set: {
            floor: r.Floor,
            roomNumber: String(r["Room Number"]),
            status: r.Status || "available",
            type: r.Type || "",
            raw: r
          }
        },
        { upsert: true }
      );
    }

    res.json({ success: true, message: "Rooms saved to MongoDB" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE room status
router.put("/:roomNumber", async (req, res) => {
  try {
    const { status } = req.body;

    const room = await Room.findOneAndUpdate(
      { roomNumber: req.params.roomNumber },
      { status },
      { new: true }
    );

    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
