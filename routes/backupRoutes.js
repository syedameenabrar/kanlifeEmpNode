const express = require('express');
const multer = require('multer');
const {
  exportDatabase,
  importDatabase,
  getEmailConfig,
  saveEmailConfig,
  sendDatabaseBackupEmail
} = require('../controllers/backupController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Full database export (JSON download)
router.get('/export', exportDatabase);

// Restore from a backup file (merge/upsert - never deletes)
router.post('/import', upload.single('file'), importDatabase);

// Admin-configured SMTP settings
router.get('/email-config', getEmailConfig);
router.put('/email-config', saveEmailConfig);

// Email a fresh backup using the configured SMTP settings
router.post('/send-email', sendDatabaseBackupEmail);

module.exports = router;
