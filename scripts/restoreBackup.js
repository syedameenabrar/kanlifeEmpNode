// Local-only disaster recovery: restores a database export directly on the
// server, with no network-reachable endpoint and no extra secret to manage.
//
// Run this if every admin login has been lost (e.g. the admin account was
// deleted) and the Database & Email Settings screen in the app can no
// longer be reached. Since it runs locally against the same database the
// server already connects to, whoever can run it already has the level of
// access this operation needs - no separate recovery password is required.
//
// Usage:
//   node scripts/restoreBackup.js /path/to/kanlife-backup-2026-10-21.json

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { performImport } = require('../controllers/backupController');

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: node scripts/restoreBackup.js /path/to/backup.json');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(resolvedPath);

  console.log('Connecting to MongoDB...');
  await mongoose.connect(
    process.env.MONGO_URI || 'mongodb+srv://dhanya:dhanya@cluster0.iktawl0.mongodb.net/kanlifeEmp'
  );
  console.log(`Connected. Restoring from ${resolvedPath} ...`);

  const summary = await performImport(buffer);

  console.log('\nRestore complete - existing records were updated, missing ones were created, nothing was deleted:\n');
  for (const [collection, result] of Object.entries(summary)) {
    const parts = [`${result.upserted} restored`];
    if (result.failed) parts.push(`${result.failed} failed`);
    if (result.skipped) parts.push(`${result.skipped} skipped`);
    console.log(`  ${collection}: ${parts.join(', ')}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Restore failed:', err);
  process.exit(1);
});
