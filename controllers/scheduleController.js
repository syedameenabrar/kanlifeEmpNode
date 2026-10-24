const Scheduleing = require('../models/Schedule');
const Employee = require('../models/Employee');

/**
 * Add new schedule (Admin creates)
 */
exports.addSchedule = async (req, res) => {
  try {
    const {
      organizationName, organizationId, employeeId, employeeName,
      unitSlNo, unitId, techName, clinicName, doctorName,
      noOfPatients, noOfPatientsLsm, noOfPatientsCap, noOfPrescriptions,
      selectedTime, createdBy, cityName,clinicAddress, ppeDate, doctorSpeciality,
  state
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
      ppeDate,
      doctorSpeciality,
  state
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
      doctorSpeciality,
  state,
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

const andConditions = [];

if (cityName || state) {

  const orConditions = [];

  if (cityName) {
    const cities = cityName
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    cities.forEach(city => {
      orConditions.push({
        cityName: {
          $regex: city,
          $options: "i"
        }
      });
    });
  }

  if (state) {
    const states = state
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    states.forEach(st => {
      orConditions.push({
        state: {
          $regex: `^${st}$`,
          $options: "i"
        }
      });
    });
  }

  andConditions.push({
    $or: orConditions
  });
}

if (andConditions.length) {
  filter.$and = andConditions;
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
    { doctorSpeciality: regex }, // NEW
    { cityName: regex },
    { state: regex },            // NEW
    { clinicAddress: regex },
    { employeeName: regex },
    { organizationName: regex }
  ];
}

// Doctor Speciality
if (doctorSpeciality) {
  const specialities = doctorSpeciality.split(',').map(s => s.trim());

  filter.doctorSpeciality = {
    $in: specialities.map(s => new RegExp(`^\\s*${s}\\s*$`, 'i'))
  };
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
        },

        uniqueDoctors: {
  $addToSet: {
    $trim: {
      input: {
        $replaceAll: {
          input: { $toLower: "$doctorName" },
          find: "  ",
          replacement: " "
        }
      }
    }
  }
}
      }
    },

    {
      $project: {
        totalPatients: 1,
        totalPatientsLsm: 1,
        totalPatientsCap: 1,
        totalPrescriptions: 1,
        totalDoctors: { $size: "$uniqueDoctors" }
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
        totalPrescriptions: summary?.[0]?.totalPrescriptions || 0,
        totalDoctors: summary?.[0]?.totalDoctors || 0
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


/**
 * Get distinct filter option lists (states, cities, specialities, years)
 * for populating the analytics dashboard's filter dropdowns.
 */
exports.getScheduleFilterOptions = async (req, res) => {
  try {
    const [states, cities, specialities, yearsAgg] = await Promise.all([
      Scheduleing.distinct('state'),
      Scheduleing.distinct('cityName'),
      Scheduleing.distinct('doctorSpeciality'),
      Scheduleing.aggregate([
        { $addFields: { _effectiveDate: { $ifNull: ['$ppeDate', '$createdAt'] } } },
        { $group: { _id: { $year: '$_effectiveDate' } } },
        { $sort: { _id: -1 } }
      ])
    ]);

    res.json({
      states: states.filter(Boolean).sort(),
      cities: cities.filter(Boolean).sort(),
      specialities: specialities.filter(Boolean).sort(),
      years: yearsAgg.map(y => y._id).filter(Boolean)
    });
  } catch (err) {
    console.error('Error fetching schedule filter options:', err);
    res.status(500).json({ message: 'Unable to fetch filter options' });
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Shared filter-parsing for both analytics endpoints below, so the two
 * aggregations stay in sync on exactly what "the current filters" means
 * without duplicating ~80 lines of match-building logic.
 */
function buildScheduleFilters(query) {
  const {
    organizationId,
    employeeId,
    doctorSpeciality,
    state,
    cityName,
    search,
    month,
    year,
    startDate,
    endDate
  } = query;

  // Filters applied to every facet (geography/people/search, no date)
  const baseMatch = {};

  if (organizationId) {
    baseMatch.organizationId = organizationId;
  }

  if (employeeId) {
    const employeeIds = employeeId.split(',').map(id => id.trim()).filter(Boolean);
    if (employeeIds.length) baseMatch.employeeId = { $in: employeeIds };
  }

  const andConditions = [];

  const orConditions = [];
  if (cityName) {
    cityName.split(',').map(c => c.trim()).filter(Boolean).forEach(city => {
      orConditions.push({ cityName: { $regex: city, $options: 'i' } });
    });
  }
  if (state) {
    state.split(',').map(s => s.trim()).filter(Boolean).forEach(st => {
      orConditions.push({ state: { $regex: `^${st}$`, $options: 'i' } });
    });
  }
  if (orConditions.length) andConditions.push({ $or: orConditions });

  if (doctorSpeciality) {
    const specialities = doctorSpeciality.split(',').map(s => s.trim()).filter(Boolean);
    if (specialities.length) {
      baseMatch.doctorSpeciality = {
        $in: specialities.map(s => new RegExp(`^\\s*${s}\\s*$`, 'i'))
      };
    }
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    andConditions.push({
      $or: [
        { clinicName: regex },
        { doctorName: regex },
        { doctorSpeciality: regex },
        { cityName: regex },
        { state: regex },
        { clinicAddress: regex },
        { employeeName: regex },
        { organizationName: regex }
      ]
    });
  }

  if (andConditions.length) baseMatch.$and = andConditions;

  // Date filter - month+year takes priority over a raw start/end range
  let dateRange = {};
  if (month && year) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10); // 1-12
    dateRange = {
      $gte: new Date(y, m - 1, 1, 0, 0, 0, 0),
      $lte: new Date(y, m, 0, 23, 59, 59, 999)
    };
  } else if (startDate || endDate) {
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateRange.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange.$lte = end;
    }
  }
  const hasDateFilter = Object.keys(dateRange).length > 0;
  const dateMatchStage = hasDateFilter ? [{ $match: { _effectiveDate: dateRange } }] : [];

  // "New vs returning doctors" tracks whichever calendar month is actually
  // selected via the month/year filter; with no month filter (or a raw
  // start/endDate range, which isn't a single calendar month) it falls
  // back to the real current month, same as before.
  const now = new Date();
  let periodStart;
  let periodEnd;
  let periodLabel;
  if (month && year) {
    periodStart = dateRange.$gte;
    periodEnd = dateRange.$lte;
    periodLabel = `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    periodLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }

  const numericField = name => ({
    $convert: { input: `$${name}`, to: 'double', onError: 0, onNull: 0 }
  });

  const addFieldsStage = {
    $addFields: {
      _effectiveDate: { $ifNull: ['$ppeDate', '$createdAt'] },
      _patients: numericField('noOfPatients'),
      _patientsLsm: numericField('noOfPatientsLsm'),
      _patientsCap: numericField('noOfPatientsCap'),
      _prescriptions: numericField('noOfPrescriptions')
    }
  };

  return {
    filtersEcho: { organizationId, employeeId, doctorSpeciality, state, cityName, search, month, year, startDate, endDate },
    organizationId,
    employeeId,
    baseMatch,
    dateMatchStage,
    periodStart,
    periodEnd,
    periodLabel,
    addFieldsStage
  };
}

/**
 * Core analytics for the dashboard: totals, monthly trend, geography
 * (state/city) and leaderboards (doctors/employees/organizations/
 * specialities). Kept deliberately lean (same facet count as the original
 * version of this endpoint) so the main dashboard view loads quickly - the
 * "Needs Attention" / "Going Quiet" / "Idle" / "Top Clinics" / "Busiest
 * Days" / "New vs Returning" extras each require their own full-collection
 * scan and are served by the separate, slower `getScheduleAnalyticsExtras`
 * below instead, so they don't block the first paint of this page.
 *
 * The monthly trend facet intentionally ignores the month/year/date filters
 * (it always shows the last 12 months) so the trend chart stays visible for
 * context while every other facet reflects the selected period - this is the
 * standard "trend stays, drill-down filters" BI dashboard pattern.
 */
exports.getScheduleAnalytics = async (req, res) => {
  try {
    const { baseMatch, dateMatchStage, addFieldsStage, filtersEcho } = buildScheduleFilters(req.query);

    const pipeline = [
      addFieldsStage,
      { $match: baseMatch },
      {
        $facet: {
          summary: [
            ...dateMatchStage,
            {
              $group: {
                _id: null,
                totalVisits: { $sum: 1 },
                totalPatients: { $sum: '$_patients' },
                totalPatientsLsm: { $sum: '$_patientsLsm' },
                totalPatientsCap: { $sum: '$_patientsCap' },
                totalPrescriptions: { $sum: '$_prescriptions' },
                uniqueDoctors: { $addToSet: { $toLower: { $trim: { input: '$doctorName' } } } },
                uniqueClinics: { $addToSet: { $toLower: { $trim: { input: '$clinicName' } } } },
                uniqueEmployees: { $addToSet: '$employeeId' },
                uniqueStates: { $addToSet: { $toLower: { $trim: { input: '$state' } } } },
                uniqueCities: { $addToSet: { $toLower: { $trim: { input: '$cityName' } } } }
              }
            },
            {
              $project: {
                _id: 0,
                totalVisits: 1,
                totalPatients: 1,
                totalPatientsLsm: 1,
                totalPatientsCap: 1,
                totalPrescriptions: 1,
                totalDoctors: { $size: '$uniqueDoctors' },
                totalClinics: { $size: '$uniqueClinics' },
                totalEmployees: { $size: '$uniqueEmployees' },
                totalStates: { $size: '$uniqueStates' },
                totalCities: { $size: '$uniqueCities' }
              }
            }
          ],

          monthlyTrend: [
            {
              $group: {
                _id: { year: { $year: '$_effectiveDate' }, month: { $month: '$_effectiveDate' } },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
              $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                visits: 1,
                patients: 1,
                prescriptions: 1
              }
            }
          ],

          byState: [
            ...dateMatchStage,
            { $match: { state: { $nin: [null, ''] } } },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$state' } } },
                state: { $first: { $trim: { input: '$state' } } },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' }
              }
            },
            { $sort: { patients: -1 } },
            { $limit: 15 },
            { $project: { _id: 0, state: 1, visits: 1, patients: 1, prescriptions: 1 } }
          ],

          byCity: [
            ...dateMatchStage,
            { $match: { cityName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$cityName' } } },
                city: { $first: { $trim: { input: '$cityName' } } },
                state: { $first: '$state' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' }
              }
            },
            { $sort: { patients: -1 } },
            { $limit: 20 },
            { $project: { _id: 0, city: 1, state: 1, visits: 1, patients: 1, prescriptions: 1 } }
          ],

          topDoctors: [
            ...dateMatchStage,
            { $match: { doctorName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$doctorName' } } },
                doctorName: { $first: '$doctorName' },
                speciality: { $first: '$doctorSpeciality' },
                clinicName: { $first: '$clinicName' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' }
              }
            },
            { $sort: { patients: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                doctorName: 1,
                speciality: 1,
                clinicName: 1,
                visits: 1,
                patients: 1,
                prescriptions: 1
              }
            }
          ],

          topEmployees: [
            ...dateMatchStage,
            { $match: { employeeName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: '$employeeId',
                employeeName: { $first: '$employeeName' },
                organizationName: { $first: '$organizationName' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' },
                uniqueDoctors: { $addToSet: { $toLower: { $trim: { input: '$doctorName' } } } }
              }
            },
            {
              $project: {
                _id: 0,
                employeeId: '$_id',
                employeeName: 1,
                organizationName: 1,
                visits: 1,
                patients: 1,
                prescriptions: 1,
                doctorsCovered: { $size: '$uniqueDoctors' }
              }
            },
            { $sort: { patients: -1 } },
            { $limit: 10 }
          ],

          byOrganization: [
            ...dateMatchStage,
            { $match: { organizationName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: '$organizationName',
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' }
              }
            },
            { $sort: { patients: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, organizationName: '$_id', visits: 1, patients: 1, prescriptions: 1 } }
          ],

          bySpeciality: [
            ...dateMatchStage,
            { $match: { doctorSpeciality: { $nin: [null, ''] } } },
            {
              $group: {
                _id: '$doctorSpeciality',
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' }
              }
            },
            { $sort: { patients: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, speciality: '$_id', visits: 1, patients: 1 } }
          ]
        }
      }
    ];

    const [result] = await Scheduleing.aggregate(pipeline);

    // Attach each employee's home city/state (from their profile, not the
    // messy free-text Schedule.cityName) so the leaderboard and AI Insights
    // can say which city a top employee is based in.
    const rosterFilter = {};
    if (filtersEcho.organizationId) rosterFilter.organizationId = filtersEcho.organizationId;
    if (filtersEcho.employeeId) {
      const employeeIds = filtersEcho.employeeId.split(',').map(id => id.trim()).filter(Boolean);
      if (employeeIds.length) rosterFilter._id = { $in: employeeIds };
    }
    const roster = await Employee.find(rosterFilter).select('name city state').lean();
    const rosterById = new Map(roster.map(e => [e._id.toString(), e]));
    const topEmployeesWithLocation = (result.topEmployees || []).map(e => ({
      ...e,
      city: rosterById.get(e.employeeId)?.city || null,
      state: rosterById.get(e.employeeId)?.state || null
    }));

    res.status(200).json({
      filters: filtersEcho,
      summary: result.summary[0] || {
        totalVisits: 0,
        totalPatients: 0,
        totalPatientsLsm: 0,
        totalPatientsCap: 0,
        totalPrescriptions: 0,
        totalDoctors: 0,
        totalClinics: 0,
        totalEmployees: 0,
        totalStates: 0,
        totalCities: 0
      },
      monthlyTrend: result.monthlyTrend,
      byState: result.byState,
      byCity: result.byCity,
      topDoctors: result.topDoctors,
      topEmployees: topEmployeesWithLocation,
      byOrganization: result.byOrganization,
      bySpeciality: result.bySpeciality
    });
  } catch (error) {
    console.error('Error building schedule analytics:', error);
    res.status(500).json({ message: 'Server error while building analytics' });
  }
};

/**
 * Secondary analytics for the dashboard: everything that needs its own
 * full-collection scan (Needs Attention signals, Doctors Going Quiet, Top
 * Clinics, Busiest Days, Idle employees, New vs Returning doctors). Split
 * out from `getScheduleAnalytics` above specifically so the main dashboard
 * view isn't stuck behind all of this - the frontend fires this request in
 * parallel and fills in these sections as they arrive, without blocking the
 * main loading spinner on them.
 */
exports.getScheduleAnalyticsExtras = async (req, res) => {
  try {
    const { baseMatch, dateMatchStage, addFieldsStage, filtersEcho, periodStart, periodEnd, periodLabel } =
      buildScheduleFilters(req.query);

    const pipeline = [
      addFieldsStage,
      { $match: baseMatch },
      {
        $facet: {
          weakCities: [
            ...dateMatchStage,
            { $match: { cityName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$cityName' } } },
                city: { $first: { $trim: { input: '$cityName' } } },
                state: { $first: '$state' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' }
              }
            },
            // cityName is free text and picks up non-visit placeholders
            // ("Weekly off", "Camp Cancelled", "NA", "...") - those always
            // have 0 patients, so excluding zero-patient groups keeps this
            // list to cities that were actually visited but underperformed.
            { $match: { patients: { $gt: 0 } } },
            { $sort: { patients: 1 } },
            { $limit: 8 },
            { $project: { _id: 0, city: 1, state: 1, visits: 1, patients: 1, prescriptions: 1 } }
          ],

          weakEmployees: [
            ...dateMatchStage,
            { $match: { employeeName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: '$employeeId',
                employeeName: { $first: '$employeeName' },
                organizationName: { $first: '$organizationName' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' },
                uniqueDoctors: { $addToSet: { $toLower: { $trim: { input: '$doctorName' } } } }
              }
            },
            {
              $project: {
                _id: 0,
                employeeId: '$_id',
                employeeName: 1,
                organizationName: 1,
                visits: 1,
                patients: 1,
                prescriptions: 1,
                doctorsCovered: { $size: '$uniqueDoctors' }
              }
            },
            { $match: { patients: { $gt: 0 } } },
            { $sort: { patients: 1 } },
            { $limit: 8 }
          ],

          weakSpecialities: [
            ...dateMatchStage,
            { $match: { doctorSpeciality: { $nin: [null, ''] } } },
            {
              $group: {
                _id: '$doctorSpeciality',
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' }
              }
            },
            { $match: { patients: { $gt: 0 } } },
            { $sort: { patients: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, speciality: '$_id', visits: 1, patients: 1 } }
          ],

          // Doctors who had a real visit history (2+ visits) but haven't
          // been seen in a while - intentionally ignores the date/month
          // filter (like monthlyTrend) since restricting to one period
          // would hide the very doctors who have no visits in that period.
          goingQuietDoctors: [
            { $match: { doctorName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$doctorName' } } },
                doctorName: { $first: '$doctorName' },
                speciality: { $first: '$doctorSpeciality' },
                clinicName: { $first: '$clinicName' },
                cityName: { $first: '$cityName' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                lastVisit: { $max: '$_effectiveDate' }
              }
            },
            { $match: { visits: { $gte: 2 } } },
            {
              $addFields: {
                daysSinceLastVisit: {
                  $round: [{ $divide: [{ $subtract: ['$$NOW', '$lastVisit'] }, 1000 * 60 * 60 * 24] }, 0]
                }
              }
            },
            { $match: { daysSinceLastVisit: { $gte: 30 } } },
            { $sort: { daysSinceLastVisit: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                doctorName: 1,
                speciality: 1,
                clinicName: 1,
                cityName: 1,
                visits: 1,
                patients: 1,
                lastVisit: 1,
                daysSinceLastVisit: 1
              }
            }
          ],

          // Clinics as their own dimension - several doctors often share one
          // clinic, so this surfaces "one stop, multiple doctors" locations
          // that the doctor-level leaderboard alone doesn't show.
          topClinics: [
            ...dateMatchStage,
            { $match: { clinicName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$clinicName' } } },
                clinicName: { $first: '$clinicName' },
                cityName: { $first: '$cityName' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' },
                prescriptions: { $sum: '$_prescriptions' },
                uniqueDoctors: { $addToSet: { $toLower: { $trim: { input: '$doctorName' } } } }
              }
            },
            {
              $project: {
                _id: 0,
                clinicName: 1,
                cityName: 1,
                visits: 1,
                patients: 1,
                prescriptions: 1,
                doctorsCovered: { $size: '$uniqueDoctors' }
              }
            },
            { $sort: { patients: -1 } },
            { $limit: 10 }
          ],

          // Day-of-week mix within whatever period is selected ($dayOfWeek:
          // 1=Sunday ... 7=Saturday - reordered to Mon-Sun on the frontend).
          byDayOfWeek: [
            ...dateMatchStage,
            {
              $group: {
                _id: { $dayOfWeek: '$_effectiveDate' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' }
              }
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, dayOfWeek: '$_id', visits: 1, patients: 1 } }
          ],

          // Full visit history per doctor (no date filter) so "new" can be
          // told apart from "returning" below - a doctor is only "new" if
          // their very first-ever visit falls inside the current month.
          doctorFirstEver: [
            { $match: { doctorName: { $nin: [null, ''] } } },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$doctorName' } } },
                firstVisit: { $min: '$_effectiveDate' }
              }
            }
          ],

          // Doctors visited in the selected period (periodStart/periodEnd above).
          doctorsThisMonth: [
            {
              $match: {
                doctorName: { $nin: [null, ''] },
                _effectiveDate: { $gte: periodStart, $lte: periodEnd }
              }
            },
            {
              $group: {
                _id: { $toLower: { $trim: { input: '$doctorName' } } },
                doctorName: { $first: '$doctorName' },
                visits: { $sum: 1 },
                patients: { $sum: '$_patients' }
              }
            }
          ],

          // Distinct employees with any activity in the selected period -
          // compared against the full employee roster afterward to find
          // employees with literally zero logged visits (not just low).
          activeEmployeeIds: [
            ...dateMatchStage,
            { $match: { employeeId: { $nin: [null, ''] } } },
            { $group: { _id: '$employeeId' } }
          ]
        }
      }
    ];

    const [result] = await Scheduleing.aggregate(pipeline);

    // Idle employees: roster members (same org/employee filter as everything
    // else) with zero entries in activeEmployeeIds for the selected period -
    // a blind spot the "weakest employee" leaderboard can't see, since that
    // one only ever lists employees who logged at least one visit.
    const rosterFilter = {};
    if (filtersEcho.organizationId) rosterFilter.organizationId = filtersEcho.organizationId;
    if (filtersEcho.employeeId) {
      const employeeIds = filtersEcho.employeeId.split(',').map(id => id.trim()).filter(Boolean);
      if (employeeIds.length) rosterFilter._id = { $in: employeeIds };
    }
    const roster = await Employee.find(rosterFilter).select('name organizationName').lean();
    const activeIdSet = new Set((result.activeEmployeeIds || []).map(e => e._id));
    const idleEmployees = roster
      .filter(e => !activeIdSet.has(e._id.toString()))
      .map(e => ({ employeeId: e._id.toString(), employeeName: e.name, organizationName: e.organizationName }));

    // New vs returning doctors for the selected period (see doctorFirstEver/doctorsThisMonth above).
    const firstEverMap = new Map((result.doctorFirstEver || []).map(d => [d._id, d.firstVisit]));
    let newDoctorsCount = 0;
    let returningDoctorsCount = 0;
    const newDoctors = [];
    for (const d of result.doctorsThisMonth || []) {
      const firstEver = firstEverMap.get(d._id);
      const isNew = !firstEver || new Date(firstEver) >= periodStart;
      if (isNew) {
        newDoctorsCount++;
        newDoctors.push({ doctorName: d.doctorName, visits: d.visits, patients: d.patients });
      } else {
        returningDoctorsCount++;
      }
    }
    newDoctors.sort((a, b) => b.patients - a.patients);

    res.status(200).json({
      filters: filtersEcho,
      weakCities: result.weakCities,
      weakEmployees: result.weakEmployees,
      weakSpecialities: result.weakSpecialities,
      goingQuietDoctors: result.goingQuietDoctors,
      topClinics: result.topClinics,
      byDayOfWeek: result.byDayOfWeek,
      idleEmployees,
      newVsReturningDoctors: {
        periodLabel,
        newCount: newDoctorsCount,
        returningCount: returningDoctorsCount,
        newDoctors: newDoctors.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error building schedule analytics extras:', error);
    res.status(500).json({ message: 'Server error while building analytics extras' });
  }
};

/**
 * Get unique clinic & doctor names for autocomplete
 */
exports.getAutocompleteData = async (req, res) => {
  try {
    const { employeeId, organizationId } = req.query;

    const filter = {};

    // Prefer employee-specific history
    if (employeeId) {
      filter.employeeId = employeeId;
    } else if (organizationId) {
      filter.organizationId = organizationId;
    }

    const data = await Scheduleing.aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: null,
          clinicNames: {
            $addToSet: {
              $trim: { input: "$clinicName" }
            }
          },
          doctorNames: {
            $addToSet: {
              $trim: { input: "$doctorName" }
            }
          },
          doctorSpecialities: {
            $addToSet: {
              $trim: { input: "$doctorSpeciality" }
            }
          }
        }
      }
    ]);

    res.json({
      clinicNames: (data[0]?.clinicNames || [])
        .filter(Boolean)
        .sort(),

      doctorNames: (data[0]?.doctorNames || [])
        .filter(Boolean)
        .sort(),

      doctorSpecialities: (data[0]?.doctorSpecialities || [])
        .filter(Boolean)
        .sort()
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Unable to fetch autocomplete data"
    });
  }
};
