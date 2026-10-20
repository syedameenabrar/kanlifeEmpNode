# Database Backup & Restore Guide

How to back up the Kanlife database and upload (restore) it again — both the
normal way (through the app) and the emergency way (if every admin login is
gone).

Restoring is always **merge/upsert**: existing records are updated by ID,
missing ones are created, and nothing already in the database is ever
deleted. It's safe to run even if the database (or a collection) is
completely empty.

---

## Step 1 — Download a backup (do this regularly)

1. Log into the app as an admin.
2. Open the menu → **Database & Email Settings** (or the **Database** card on
   the Home screen).
3. Tap **Download Full Backup**.
4. A file named `kanlife-backup-<date>.json` downloads. This one file
   contains every collection: employees, organizations, equipment,
   schedules, attendance, and admin accounts.
5. **Save this file somewhere outside the app** — your laptop, a cloud
   drive, a password manager's file storage, etc. This file is also your way
   back in if the admin account itself is ever deleted (see Method 2 below),
   so don't only keep it on the same server as the app.

Optional: you can also email a fresh backup to yourself (or several people)
straight from the same screen —
1. Fill in the **Email Configuration (SMTP)** section once (host, port,
   username, password, from address) and tap **Save Email Configuration**.
2. Add one or more addresses under **Recipients** (type an email, tap the
   **+** button — repeat for as many people as you want; tap the **×** on a
   chip to remove one).
3. Tap **Send Backup by Email** to send immediately to everyone on that
   list, any time.

### Automatic backups every N days (no manual steps needed)

In the same **Email Configuration** section:

1. Add your recipients (see above) and save the SMTP settings at least once.
2. Turn on **Automatically email backups**.
3. Set **Send every (days)** — defaults to `15`.
4. Tap **Save Email Configuration**.

From then on, the backend checks once a day whether it's been that many
days since the last send, and if so, builds a fresh backup and emails it to
everyone in **Recipients** automatically — no one needs to open the app. The
screen shows **Last auto-sent** once the first one has gone out. This keeps
running for as long as the backend server process is running; if the server
is restarted, it re-checks shortly after startup so an overdue send is never
silently skipped.

---

## Method 1 — Upload (restore) a backup through the app (normal case)

Use this whenever you're logged in as an admin and just want to merge a
backup file back in — e.g. restoring after accidentally deleting some
records, or moving data between environments.

1. Log into the app as an admin.
2. Open the menu → **Database & Email Settings**.
3. Tap **Import Backup**.
4. Pick the `kanlife-backup-<date>.json` file you downloaded earlier.
5. Confirm the dialog — it explains this merges by ID and deletes nothing.
6. Wait for the **Import Complete** summary, which lists how many records
   were restored per collection (and flags any that failed).

That's it — the data is back.

---

## Method 2 — Emergency restore when you can't log in at all

Use this only if every admin account is gone and you can no longer reach the
Database & Email Settings screen in the app. This runs directly on the
server instead of through the app, so it doesn't need a login at all.

1. Get a terminal on the machine running the backend (SSH, or locally if
   you're running it yourself).
2. Go to the backend folder:
   ```
   cd kanlifeEmpNode
   ```
3. Run the restore script, pointing it at a backup file you saved earlier:
   ```
   node scripts/restoreBackup.js /path/to/kanlife-backup-<date>.json
   ```
   or, equivalently:
   ```
   npm run restore-backup -- /path/to/kanlife-backup-<date>.json
   ```
4. It connects to the database and prints a summary per collection, e.g.:
   ```
   Restore complete - existing records were updated, missing ones were created, nothing was deleted:

     admins: 1 restored
     employees: 61 restored
     organizations: 11 restored
     ppeEquipments: 71 restored
     schedules: 9057 restored
     attendance: 0 restored
   ```
5. Because the backup includes the `admins` collection, this also restores
   whatever admin account existed when that backup was taken — log into the
   app normally with it afterward.

There is deliberately no equivalent "restore" button reachable over the
network without logging in — only this local script. A login-free upload
endpoint on the internet is a backdoor waiting to happen; a script that only
someone with server access can run is not.

---

## Quick reference

| I want to... | Do this |
|---|---|
| Take a backup | App → Database & Email Settings → **Download Full Backup** |
| Restore data, logged in as admin | App → Database & Email Settings → **Import Backup** |
| Restore data, locked out of every admin account | On the server: `node scripts/restoreBackup.js <file>` |
| Email a backup right now, to one or more people | App → Database & Email Settings → add recipients → **Send Backup by Email** |
| Get a backup emailed automatically every N days | App → Database & Email Settings → add recipients → turn on **Automatically email backups** → set days → **Save Email Configuration** |
