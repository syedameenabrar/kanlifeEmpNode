const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },  // optional login field
  email: { type: String, unique: true, sparse: true },  // optional login field
  password: { type: String, required: true },
  address: { type: String },
  profileImage: { type: String }, 

  accountType: { type: String, default: 'organization' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
