const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");

// ✅ GET /newapi/attendance
router.get("/", async (req, res) => {
  try {
    const docs = await Attendance.find().sort({ createdAt: -1 });
    res.json(docs.map(d => d.raw));
  } catch (error) {
    console.error("❌ Error fetching attendance:", error);
    res.status(500).json({ success: false, error: "Failed to fetch attendance" });
  }
});

// ✅ POST /newapi/attendance
router.post("/", async (req, res) => {
  try {
    const raw = req.body || {};

    const attendanceId = raw["Attendance ID"] || raw.attendanceId;
    const staffId = raw["Staff ID"] || raw.staffId || "";
    const staffName = raw["Staff Name"] || raw.staffName || "";
    const date = raw["Date"] || raw.date || "";
    const time = raw["Time"] || raw.time || "";
    const status = raw["Status"] || raw.status || "Present";

    if (!attendanceId) {
      return res.status(400).json({ success: false, error: "Attendance ID is required" });
    }

    const saved = await Attendance.findOneAndUpdate(
      { attendanceId },
      {
        attendanceId,
        staffId,
        staffName,
        date,
        time,
        status,
        raw: {
          ...raw,
          "Attendance ID": attendanceId,
          "Staff ID": staffId,
          "Staff Name": staffName,
          Date: date,
          Time: time,
          Status: status
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, attendance: saved.raw });
  } catch (error) {
    console.error("❌ Error recording attendance:", error);
    res.status(500).json({ success: false, error: "Failed to record attendance" });
  }
});

module.exports = router;
