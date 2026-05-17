const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({

  organizationName: { type: String, trim: true },
  organizationId: { type: String, trim: true },

  employeeId: { type: String, trim: true },
  employeeName: { type: String, trim: true },

  unitSlNo: { type: String, trim: true },
  unitId: { type: String, trim: true },

  techName: { type: String, trim: true },

  clinicName: { type: String, trim: true },
  doctorName: { type: String, trim: true },

  noOfPatients: { type: Number, default: 0 },
  noOfPatientsLsm: { type: Number, default: 0 },
  noOfPatientsCap: { type: Number, default: 0 },
  noOfPrescriptions: { type: Number, default: 0 },

  selectedTime: { type: String },

  createdBy: { type: String, trim: true },

  cityName: { type: String, trim: true },

  clinicAddress: { type: String, trim: true },

  ppeDate: { type: Date }

}, {
  timestamps: true
});


// Single indexes
scheduleSchema.index({ employeeId: 1 });
scheduleSchema.index({ organizationId: 1 });
scheduleSchema.index({ cityName: 1 });
scheduleSchema.index({ ppeDate: -1 });
scheduleSchema.index({ createdAt: -1 });

// Compound index
scheduleSchema.index({
  organizationId: 1,
  employeeId: 1,
  cityName: 1,
  ppeDate: -1
});

module.exports = mongoose.model('Schedule', scheduleSchema);