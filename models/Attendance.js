const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  }
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true }); // Prevent duplicate attendance

module.exports = mongoose.model('Attendance', attendanceSchema);
