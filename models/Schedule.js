const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  organizationName: { type: String },
  organizationId: { type: String },
  employeeId: { type: String },
  employeeName: { type: String },
  unitSlNo: { type: String },
  unitId: { type: String },
  techName: { type: String },
  clinicName: { type: String },
  doctorName: { type: String },
  noOfPatients: { type: String },
  noOfPatientsLsm: { type: String },
  noOfPatientsCap: { type: String },
  selectedTime: { type: String },
  createdBy: {type: String},
  cityName: {type: String},
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
