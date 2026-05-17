const Scheduleing = require('../models/Schedule');

/**
 * Add new schedule (Admin creates)
 */
exports.addSchedule = async (req, res) => {
  try {
    const {
      organizationName, organizationId, employeeId, employeeName,
      unitSlNo, unitId, techName, clinicName, doctorName,
      noOfPatients, noOfPatientsLsm, noOfPatientsCap, noOfPrescriptions,
      selectedTime, createdBy, cityName,clinicAddress, ppeDate
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
      noOfPrescriptions,
      selectedTime,
      createdBy,
      cityName,
      clinicAddress,
      ppeDate
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
    const {
      organizationId,
      employeeId,
      startDate,
      endDate,
      cityName,
      search,          // ✅ ADD THIS
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    // Organization
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    // Employee
    if (employeeId) {
      const employeeIds = employeeId.split(',').map(id => id.trim());
      filter.employeeId = { $in: employeeIds };
    }

    // City
    if (cityName) {
      const cities = cityName.split(',').map(c => c.trim());
      filter.cityName = {
        $in: cities.map(c => new RegExp(`^\\s*${c}\\s*$`, 'i'))
      };
    }

    // Date range
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

      filter.ppeDate = range;
    }

    // 🔥 SEARCH (IMPORTANT FIX)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');

      filter.$or = [
        { clinicName: regex },
        { doctorName: regex },
        { cityName: regex },
        { clinicAddress: regex },
        { employeeName: regex },
        { organizationName: regex }
      ];
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const [schedules, total, summary] = await Promise.all([
      Scheduleing.find(filter)
        .sort({ ppeDate: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Scheduleing.countDocuments(filter),

      Scheduleing.aggregate([
  { $match: filter },
  {
    $group: {
      _id: null,

      totalPatients: {
        $sum: {
          $convert: {
            input: "$noOfPatients",
            to: "double",
            onError: 0,
            onNull: 0
          }
        }
      },

      totalPatientsLsm: {
        $sum: {
          $convert: {
            input: "$noOfPatientsLsm",
            to: "double",
            onError: 0,
            onNull: 0
          }
        }
      },

      totalPatientsCap: {
        $sum: {
          $convert: {
            input: "$noOfPatientsCap",
            to: "double",
            onError: 0,
            onNull: 0
          }
        }
      },

      totalPrescriptions: {
        $sum: {
          $convert: {
            input: "$noOfPrescriptions",
            to: "double",
            onError: 0,
            onNull: 0
          }
        }
      }
    }
  }
])
    ]);

    res.status(200).json({
      data: schedules,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      summary: {
        totalPatients: summary?.[0]?.totalPatients || 0,
        totalPatientsLsm: summary?.[0]?.totalPatientsLsm || 0,
        totalPatientsCap: summary?.[0]?.totalPatientsCap || 0,
        totalPrescriptions: summary?.[0]?.totalPrescriptions || 0
      }
    });

  } catch (error) {
    console.error('Error fetching filtered schedules:', error);
    res.status(500).json({ message: 'Server error while fetching schedules' });
  }
};


/**
 * Delete schedule by ID
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSchedule = await Scheduleing.findByIdAndDelete(id);

    if (!deletedSchedule) {
      return res.status(404).json({
        message: "Schedule not found",
        status: "error"
      });
    }

    res.status(200).json({
      message: "Schedule deleted successfully",
      status: "success",
      schedule: deletedSchedule
    });

  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({
      message: "Server error while deleting schedule",
      error: error.message
    });
  }
};

