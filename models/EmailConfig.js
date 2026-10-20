const mongoose = require('mongoose');

// Singleton document holding the admin-configured SMTP settings used to
// email database backups. Only one document should ever exist.
const emailConfigSchema = new mongoose.Schema({
  smtpHost: { type: String },
  smtpPort: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  smtpUser: { type: String },
  smtpPassword: { type: String },
  fromName: { type: String, default: 'Kanlife' },
  fromEmail: { type: String },

  // Every address a backup should go to - manual "send now" and the
  // scheduled auto-send both use this same list.
  recipients: { type: [String], default: [] },

  // Scheduled auto-send: when enabled, a backup is emailed to every
  // recipient every `intervalDays` days. `lastSentAt` is how the interval
  // survives server restarts - it's a rolling "days since last send" check,
  // not a fixed calendar day, so a restart never skips or double-sends.
  autoSendEnabled: { type: Boolean, default: false },
  intervalDays: { type: Number, default: 15 },
  lastSentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('EmailConfig', emailConfigSchema);
