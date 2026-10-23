const nodemailer = require('nodemailer');

const Employee = require('../models/Employee');
const Organization = require('../models/Orgnization');
const PpeEquipments = require('../models/PpeEquipments');
const Schedule = require('../models/Schedule');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const EmailConfig = require('../models/EmailConfig');

const COLLECTIONS = {
  admins: User,
  employees: Employee,
  organizations: Organization,
  ppeEquipments: PpeEquipments,
  schedules: Schedule,
  attendance: Attendance
};

async function buildBackupPayload() {
  const payload = {
    exportedAt: new Date().toISOString(),
    collections: {}
  };

  for (const [key, Model] of Object.entries(COLLECTIONS)) {
    payload.collections[key] = await Model.find().lean();
  }

  return payload;
}

/**
 * Rough total export size, used only to drive the client's download
 * progress bar - sampling one document per collection and multiplying by
 * an estimated count is cheap and close enough for a progress estimate.
 * Never used as the real Content-Length: the export is streamed (chunked)
 * precisely so an exact size never has to be known up front.
 */
async function estimateExportSize() {
  let total = 0;
  for (const Model of Object.values(COLLECTIONS)) {
    const [count, sample] = await Promise.all([
      Model.estimatedDocumentCount(),
      Model.findOne().lean()
    ]);
    const sampleSize = sample ? Buffer.byteLength(JSON.stringify(sample)) : 0;
    total += count * sampleSize;
  }
  return total;
}

/**
 * Download a full JSON snapshot of every collection in the database.
 *
 * Streams documents one at a time via a cursor instead of loading every
 * collection into memory and building one giant pretty-printed string -
 * on a memory-constrained host, buffering the whole (and growing) backup
 * in RAM before sending it was crashing the process mid-response, which
 * shows up client-side as a 200 OK that still fails (connection reset
 * partway through the body).
 */
exports.exportDatabase = async (req, res) => {
  const filename = `kanlife-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  try {
    const estimatedSize = await estimateExportSize();
    res.setHeader('X-Estimated-Size', String(estimatedSize));

    res.write(`{"exportedAt":${JSON.stringify(new Date().toISOString())},"collections":{`);

    const keys = Object.keys(COLLECTIONS);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      res.write(`${JSON.stringify(key)}:[`);

      let isFirst = true;
      const cursor = COLLECTIONS[key].find().lean().cursor();
      for await (const doc of cursor) {
        res.write(`${isFirst ? '' : ','}${JSON.stringify(doc)}`);
        isFirst = false;
      }

      res.write(`]${i < keys.length - 1 ? ',' : ''}`);
    }

    res.end('}}');
  } catch (err) {
    console.error('Error exporting database:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to export database' });
    } else {
      res.end();
    }
  }
};

/**
 * Shared restore logic used by both the HTTP import route (logged-in admin)
 * and scripts/restoreBackup.js (local disaster recovery). Upserts by _id
 * into each collection - inserts anything missing, updates anything that
 * already exists, and never deletes records that aren't present in the
 * file. Safe to run against empty collections (e.g. after a full wipe):
 * every document is simply treated as new and inserted.
 */
async function performImport(buffer) {
  let payload;
  try {
    payload = JSON.parse(buffer.toString('utf8'));
  } catch (parseErr) {
    const err = new Error('Uploaded file is not valid JSON');
    err.statusCode = 400;
    throw err;
  }

  const collections = payload?.collections;
  if (!collections || typeof collections !== 'object') {
    const err = new Error('Backup file is missing a "collections" object');
    err.statusCode = 400;
    throw err;
  }

  const summary = {};

  for (const [key, Model] of Object.entries(COLLECTIONS)) {
    const docs = Array.isArray(collections[key]) ? collections[key] : [];

    if (!docs.length) {
      summary[key] = { upserted: 0, skipped: 0, failed: 0 };
      continue;
    }

    const ops = [];
    let skipped = 0;

    for (const doc of docs) {
      if (!doc || !doc._id) {
        skipped++;
        continue;
      }
      const { _id, __v, ...rest } = doc;
      ops.push({
        updateOne: {
          filter: { _id },
          update: { $set: rest },
          upsert: true
        }
      });
    }

    let failed = 0;
    if (ops.length) {
      try {
        await Model.bulkWrite(ops, { ordered: false });
      } catch (bulkErr) {
        failed = bulkErr?.writeErrors?.length || ops.length;
      }
    }

    summary[key] = { upserted: ops.length - failed, skipped, failed };
  }

  return summary;
}

// Exposed so scripts/restoreBackup.js (a local, non-HTTP recovery path for
// when nobody can log in at all) can reuse the exact same restore logic
// without duplicating it.
exports.performImport = performImport;

/**
 * Restore from a previously exported JSON backup (normal, logged-in flow).
 */
exports.importDatabase = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file uploaded' });
    }

    const summary = await performImport(req.file.buffer);

    res.status(200).json({
      message: 'Backup imported — existing records were updated and missing ones created. Nothing was deleted.',
      summary
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('Error importing database:', err);
    res.status(500).json({ message: 'Failed to import database', error: err.message });
  }
};

/**
 * Return the stored SMTP configuration. The actual password is never sent
 * back to the client - only whether one is currently set - so the admin UI
 * can show a masked placeholder instead of the real secret.
 */
exports.getEmailConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findOne();

    res.json({
      smtpHost: config?.smtpHost || '',
      smtpPort: config?.smtpPort || 587,
      secure: !!config?.secure,
      smtpUser: config?.smtpUser || '',
      smtpPasswordSet: !!config?.smtpPassword,
      fromName: config?.fromName || 'Kanlife',
      fromEmail: config?.fromEmail || '',
      recipients: config?.recipients || [],
      autoSendEnabled: !!config?.autoSendEnabled,
      intervalDays: config?.intervalDays || 15,
      lastSentAt: config?.lastSentAt || null
    });
  } catch (err) {
    console.error('Error loading email configuration:', err);
    res.status(500).json({ message: 'Failed to load email configuration' });
  }
};

/**
 * Save SMTP configuration. A blank smtpPassword means "leave the existing
 * password alone" since the UI never has the real value to send back.
 */
exports.saveEmailConfig = async (req, res) => {
  try {
    const {
      smtpHost, smtpPort, secure, smtpUser, smtpPassword, clearPassword,
      fromName, fromEmail, recipients, autoSendEnabled, intervalDays
    } = req.body;

    const updates = {
      smtpHost, smtpPort, secure, smtpUser, fromName, fromEmail,
      recipients: Array.isArray(recipients)
        ? [...new Set(recipients.map(r => String(r).trim()).filter(Boolean))]
        : [],
      autoSendEnabled: !!autoSendEnabled,
      intervalDays: Number(intervalDays) > 0 ? Number(intervalDays) : 15
    };

    if (clearPassword) {
      updates.smtpPassword = '';
    } else if (smtpPassword) {
      updates.smtpPassword = smtpPassword;
    }

    let config = await EmailConfig.findOne();
    if (!config) {
      config = new EmailConfig(updates);
    } else {
      Object.assign(config, updates);
    }
    await config.save();

    res.json({ message: 'Email configuration saved successfully' });
  } catch (err) {
    console.error('Error saving email configuration:', err);
    res.status(500).json({ message: 'Failed to save email configuration' });
  }
};

/**
 * Build a fresh backup and email it as a JSON attachment to one or more
 * recipients using the admin-configured SMTP settings. Shared by the manual
 * "send now" route and the scheduled auto-send job.
 */
async function sendBackupToRecipients(config, recipients) {
  const payload = await buildBackupPayload();
  const filename = `kanlife-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: !!config.secure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword
    }
  });

  await transporter.sendMail({
    from: `"${config.fromName || 'Kanlife'}" <${config.fromEmail || config.smtpUser}>`,
    to: recipients.join(', '),
    subject: `Kanlife database backup - ${new Date().toISOString().slice(0, 10)}`,
    text: 'Attached is the latest full database backup.',
    attachments: [
      {
        filename,
        content: JSON.stringify(payload, null, 2),
        contentType: 'application/json'
      }
    ]
  });
}

/**
 * Manual "send now" - emails a fresh backup immediately. Defaults to every
 * configured recipient; `req.body.to` can override with a one-off address
 * without touching the saved configuration.
 */
exports.sendDatabaseBackupEmail = async (req, res) => {
  try {
    const config = await EmailConfig.findOne();
    if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPassword) {
      return res.status(400).json({ message: 'Email is not configured yet. Set up SMTP details first.' });
    }

    const recipients = req.body?.to ? [req.body.to] : (config.recipients || []);
    if (!recipients.length) {
      return res.status(400).json({ message: 'No recipient provided and no recipients configured.' });
    }

    await sendBackupToRecipients(config, recipients);

    res.json({ message: `Backup emailed to ${recipients.join(', ')} successfully` });
  } catch (err) {
    console.error('Error emailing database backup:', err);
    res.status(500).json({ message: 'Failed to send backup email', error: err.message });
  }
};

/**
 * Called on a recurring schedule (see scheduler.js). Sends a backup to every
 * configured recipient if auto-send is on and `intervalDays` have passed
 * since the last send - a rolling check based on `lastSentAt`, not a fixed
 * calendar day, so server restarts never skip or double-send.
 */
exports.runScheduledBackupEmailIfDue = async () => {
  const config = await EmailConfig.findOne();
  if (!config || !config.autoSendEnabled) return;
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) return;
  if (!config.recipients?.length) return;

  const intervalMs = (config.intervalDays || 15) * 24 * 60 * 60 * 1000;
  const due = !config.lastSentAt || (Date.now() - new Date(config.lastSentAt).getTime()) >= intervalMs;
  if (!due) return;

  try {
    await sendBackupToRecipients(config, config.recipients);
    config.lastSentAt = new Date();
    await config.save();
    console.log(`Scheduled backup emailed to ${config.recipients.join(', ')}`);
  } catch (err) {
    console.error('Scheduled backup email failed:', err);
  }
};
