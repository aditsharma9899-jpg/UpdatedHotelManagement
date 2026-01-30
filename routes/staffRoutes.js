const express = require('express');
//import Room from "../models/Room.js";
//const Room = require('../models/Rooms.js')

const router = express.Router();

// GET all rooms
router.get("/", async (req, res) => {
  try {
    //const rooms = await Staff.find().sort({ roomNumber: 1 });
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

module.exports = router;
