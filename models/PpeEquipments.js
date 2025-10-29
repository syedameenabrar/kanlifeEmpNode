const mongoose = require('mongoose');

const ppeEquipmentSchema = new mongoose.Schema({
  type: { type: String },
  slNo: { type: String },
  refferenceName: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PpeEquipment', ppeEquipmentSchema);
