const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },  // optional login field
  email: { type: String, unique: true, sparse: true },  // optional login field
  password: { type: String, required: true },
  ppeEquipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PpeEquipment', required: function() { return this.empType === 'ppe'; }  },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization'},
  organizationName: {type:String},
  ppeEquipmentSlNo: {type:String},
  ppeEquipmentType: { type: String},



  // Future fields
  salary: { type: Number, default: 0 },
  jobType: { type: String, enum: ['full-time', 'part-time'], default: 'full-time' },
  empType: { type: String, enum: ['ppe', 'office'], default: 'office' },

  bloodGroup: { type: String },
  address: { type: String },
  dob: { type: Date },
  profileImage: { type: String }, 

  accountType: { type: String, default: 'employee' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
