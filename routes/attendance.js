const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// ✅ Employee marks attendance
router.post('/mark', async (req, res) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, location } = req.body;

    // Use today's date if not provided
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ employeeId, date: attendanceDate });
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked' });
    }

    const attendance = new Attendance({
      employeeId,
      date: attendanceDate,
      status: 'present',
      checkInTime,
      checkOutTime,
      location
    });

    await attendance.save();
    res.json({ message: 'Attendance marked', attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Admin gets monthly attendance
router.get('/monthly/:month/:year', async (req, res) => {
  try {
    const { month, year } = req.params; // month = 1-12
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendance = await Attendance.find({ date: { $gte: startDate, $lte: endDate } })
      .populate('employeeId', 'name email phone');

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Admin updates attendance
router.put('/:id', async (req, res) => {
  try {
    const { status, checkInTime, checkOutTime, location } = req.body;
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, checkInTime, checkOutTime, location },
      { new: true }
    );

    res.json({ message: 'Attendance updated', updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
