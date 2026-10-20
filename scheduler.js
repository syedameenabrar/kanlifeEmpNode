const cron = require('node-cron');
const { runScheduledBackupEmailIfDue } = require('./controllers/backupController');

/**
 * Checks once a day whether a scheduled backup email is due (see
 * EmailConfig.intervalDays / lastSentAt). A daily check rather than a fixed
 * "day 15" cron expression is what makes an arbitrary N-day interval work,
 * and it self-heals if the server was down at the last check - the next
 * check just finds it's overdue and sends immediately.
 */
function startBackupEmailScheduler() {
  // Every day at 03:00 server time.
  cron.schedule('0 3 * * *', () => {
    runScheduledBackupEmailIfDue().catch(err => {
      console.error('Scheduled backup email check failed:', err);
    });
  });

  // Also check shortly after startup, in case the server was down through
  // the last scheduled check and a send is overdue.
  setTimeout(() => {
    runScheduledBackupEmailIfDue().catch(err => {
      console.error('Startup backup email check failed:', err);
    });
  }, 30 * 1000);
}

module.exports = { startBackupEmailScheduler };
