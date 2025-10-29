const express = require('express');
const { addSchedule, getAllSchedules, getScheduleById, updatePpeSchedule , getSchedulesByEmployeeId, getSchedulesByOrganizationId, getFilteredSchedules} = require('../controllers/scheduleController');
const router = express.Router();

// Admin adds schedule
router.post('/add', addSchedule);

// New flexible filter route
router.get('/filter', getFilteredSchedules);
// GET all schedule
router.get('/', getAllSchedules);

// GET single schedule by ID
router.get('/:id', getScheduleById);

// ✅ Update schedule (use PUT or PATCH, not POST)
router.put('/:id', updatePpeSchedule);

// 🔹 New route: fetch schedules for specific employee
router.get('/employee/:employeeId', getSchedulesByEmployeeId);

// 🔹 New route: fetch schedules for specific organization
router.get('/organization/:organizationId', getSchedulesByOrganizationId);







module.exports = router;
