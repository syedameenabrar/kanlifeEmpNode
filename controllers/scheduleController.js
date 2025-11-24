const Scheduleing = require('../models/Schedule');

/**
 * Add new schedule (Admin creates)
 */
exports.addSchedule = async (req, res) => {
  try {
    const {
      organizationName, organizationId, employeeId, employeeName,
      unitSlNo, unitId, techName, clinicName, doctorName,
      noOfPatients, noOfPatientsLsm, noOfPatientsCap,
      selectedTime, createdBy, cityName
    } = req.body;

    const schedule = new Scheduleing({
      organizationName,
      organizationId,
      employeeId,
      employeeName,
      unitSlNo,
      unitId,
      techName,
      clinicName,
      doctorName,
      noOfPatients,
      noOfPatientsLsm,
      noOfPatientsCap,
      selectedTime,
      createdBy,
      cityName
    });

    await schedule.save();

    res.status(201).json({
      message: "Schedule created successfully",
      schedule,
      status: 'success'
    });
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all schedules
 */
exports.getAllSchedules = async (req, res) => {
  try {
    const schedules = await Scheduleing.find().sort({ createdAt: -1 });
    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error while fetching schedules' });
  }
};

/**
 * Get single schedule by ID
 */
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Scheduleing.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.status(200).json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Server error while fetching schedule' });
  }
};

/**
 * Update PPE schedule
 */
exports.updatePpeSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedSchedule = await Scheduleing.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedSchedule) return res.status(404).json({ error: 'Schedule not found' });

    res.json({
      message: 'Schedule updated successfully',
      schedule: updatedSchedule,
      status: 'success'
    });
  } catch (err) {
    console.error('Error updating schedule:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get schedules by employee ID
 */
exports.getSchedulesByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });

    const schedules = await Scheduleing.find({ employeeId }).sort({ selectedTime: -1 });
    if (!schedules.length) return res.status(200).json({ message: 'No schedules found for this employee' });

    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules by employeeId:', error);
    res.status(500).json({ message: 'Server error while fetching schedules' });
  }
};

/**
 * Get schedules by organization ID
 */
exports.getSchedulesByOrganizationId = async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!organizationId) return res.status(400).json({ message: 'Organization ID is required' });

    const schedules = await Scheduleing.find({ organizationId }).sort({ selectedTime: -1 });
    if (!schedules.length) return res.status(200).json({ message: 'No schedules found for this organization' });

    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules by organizationId:', error);
    res.status(500).json({ message: 'Server error while fetching schedules' });
  }
};

/**
 * Get schedules by flexible filters
 */
/**
 * Get schedules by flexible filters
 */
exports.getFilteredSchedules = async (req, res) => {
  try {
    const { organizationId, employeeId, startDate, endDate, cityName } = req.query;
    const filter = {};

    if (organizationId) filter.organizationId = organizationId;

    // 👥 Handle multiple employee IDs
    if (employeeId) {
      const employeeIds = employeeId.split(',').map(id => id.trim()).filter(Boolean);
      if (employeeIds.length > 0) filter.employeeId = { $in: employeeIds };
    }

    // 🌆 Handle multiple city filters
    if (cityName) {
      const cities = cityName.split(',').map(c => c.trim()).filter(Boolean);
      if (cities.length > 0) {
        filter.$or = cities.map(c => ({
          cityName: { $regex: new RegExp(`^${c}$`, 'i') } // case-insensitive exact match
        }));
      }
    }
    

    // 📅 Handle date range
    if (startDate || endDate) {
      const range = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        range.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        range.$lte = end;
      }
      filter.createdAt = range;
    }

    console.log('📅 Final Filter Query:', JSON.stringify(filter, null, 2));

    const schedules = await Scheduleing.find(filter).sort({ createdAt: -1 });
    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching filtered schedules:', error);
    res.status(500).json({ message: 'Server error while fetching schedules' });
  }
};


