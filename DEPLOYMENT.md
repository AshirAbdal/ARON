# ARON — Deployment Guide (cPanel Shared Hosting)

Domain: **aronbd.net**  •  cPanel user: **aronbdne**  •  Home: `/home/aronbdne`

This guide is in **strict order** — do every step in the sequence shown.

| Step | What you do | Where |
|---|---|---|
| 1 | Pre-flight checks | cPanel home |
| 2 | Create the `admin.aronbd.net` subdomain | cPanel → Domains |
| 3 | Set up the folder layout on the server | cPanel → File Manager |
| 4 | Create the two Node.js apps + verify build tools | cPanel → Setup Node.js App |
| 5 | Create FTP accounts (one per folder) | cPanel → FTP Accounts |
| 6 | Prepare files locally and upload via FTP | Your Mac → server |
| 7 | Build & start the apps | cPanel Terminal |
| 8 | Upload the SQLite database | FTP / File Manager |
| 9 | Configure SMTP and wire it into the project | cPanel → Email + code |
| 10 | Maintenance: backups, updates, SSL | cPanel |

> ⚠️ **Critical pre-check.** This project is a **Next.js (Node.js)** app using **`better-sqlite3`** (a native C++ module). It **will not run on a PHP-only plan**. In cPanel, look in the **Software** section for **"Setup Node.js App"**. If that icon is missing, your plan is PHP-only — upgrade or switch hosts before continuing.

---

## Step 1 — Pre-flight checklist

Open cPanel and confirm all of the following:

- [ ] **Software → Setup Node.js App** (a.k.a. "Node.js Selector") exists.
- [ ] **Software → Terminal** is available (needed to run `npm install` and `npm run build`).
- [ ] Node.js version **20.x** or newer is in the version dropdown.
- [ ] **Files → File Manager** and **Files → FTP Accounts** are present.
- [ ] **Domains → Domains** (or → Subdomains) is present.
- [ ] **Email → Email Accounts** and **Email → Email Deliverability** exist.

If anything is missing, open a support ticket: *"Please enable Node.js Selector + shell access + build tools (python3, gcc, make) for native module compilation."* Wait until they confirm before continuing.

---

## Step 2 — Create the `admin.aronbd.net` subdomain (do this FIRST)

The subdomain must exist before you create the Node app, because the Node app screen asks which domain it binds to.

1. **cPanel → Domains → Domains** → click **Create A New Domain** (older cPanel: **Domains → Subdomains**).
2. Fill in:
   - **Domain**: `admin.aronbd.net`
   - **Share document root with "aronbd.net"**: ❌ **uncheck**.
   - **Document Root**: `/home/aronbdne/apps/Admin/public`
     *(The folder doesn't exist yet — that's fine, cPanel will create it.)*
3. Click **Submit**.
4. cPanel auto-creates the DNS A-record pointing `admin.aronbd.net` to your shared IP `107.181.234.46`, and queues an AutoSSL request.
5. Wait 2–5 minutes, then visit `http://admin.aronbd.net`. You should see an empty index page or "Index of /" — that means DNS works.

> **If your DNS lives on Cloudflare** (not in cPanel), you also need to add an `A` record there: `admin → 107.181.234.46`, **proxy off** until SSL is verified, then you can turn it back on.

---

## Step 3 — Create the folder layout on the server

Open **cPanel → File Manager**, navigate to your home directory `/home/aronbdne`, and create this structure:

```
/home/aronbdne/
├── apps/
│   ├── Admin/        ← admin Next.js app  (folder may already exist from step 2)
│   ├── Arong/        ← storefront Next.js app
│   └── db/
│       └── arong.db  ← SQLite database (uploaded in step 8)
├── backups/          ← daily DB backups (cron in step 10)
└── public_html/      ← leave alone
```

Steps:
1. Create folder `apps` (if not already created by step 2).
2. Inside `apps`, create folders `Arong` and `db`.
3. Create folder `backups` in your home directory.

> ✅ Keep `apps/` **outside** `public_html`. Putting Node app source inside `public_html` would expose your code over plain HTTP.

---

## Step 4 — Create Node.js apps + verify build tools

You will create **two Node.js apps** in cPanel — one for the storefront, one for the admin panel. Each gets its own isolated `node_modules` and Node version managed by the Node.js Selector.

### 4.1  Create the storefront Node app

1. **cPanel → Setup Node.js App → Create Application**.
2. Settings:
   - **Node.js version**: `20.x` (or latest LTS available).
   - **Application mode**: `Production`.
   - **Application root**: `apps/Arong`
   - **Application URL**: `aronbd.net` (root domain)
   - **Application startup file**: `server.js`  *(file you'll upload in step 6)*
3. Click **Create**. cPanel assigns an internal port and writes a Phusion Passenger config.
4. In the **Environment Variables** section on the same page, add:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_PATH` | `/home/aronbdne/apps/db/arong.db` |
   | `SMTP_HOST` | `mail.aronbd.net` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `noreply@aronbd.net` |
   | `SMTP_PASS` | *(filled in step 9)* |
   | `SMTP_FROM` | `"ARON" <noreply@aronbd.net>` |

5. Click **Save**. **Don't start the app yet** — there's no code in the folder.

### 4.2  Create the admin Node app

Repeat 4.1 with these changes:
- **Application root**: `apps/Admin`
- **Application URL**: `admin.aronbd.net`
- Same environment variables.

### 4.3  Verify build tools exist

`better-sqlite3` is compiled from C++ on the server. Open **cPanel → Terminal** and run:

```bash
which python3 && which make && which g++ && node -v
```

All four should print a path / version. If any is missing, open a support ticket: *"My Node.js Selector environment needs python3, make and g++ to compile native modules (better-sqlite3)."* Wait for confirmation before continuing.

---

## Step 5 — Create FTP accounts (one per folder)

Best practice: a separate FTP user for each top-level folder so a leaked password only exposes one app.

You'll create **three** FTP accounts:

| FTP user | Purpose | Jailed directory |
|---|---|---|
| `storefront@aronbd.net` | Upload the storefront app | `/home/aronbdne/apps/Arong` |
| `admin@aronbd.net`      | Upload the admin app      | `/home/aronbdne/apps/Admin` |
| `db@aronbd.net`         | Upload / download the DB  | `/home/aronbdne/apps/db` |

For each account:

1. **cPanel → Files → FTP Accounts → Add FTP Account**.
2. Fill in:
   - **Log In**: e.g. `storefront` (full username becomes `storefront@aronbd.net`).
   - **Password**: click **Password Generator**, save it to a password manager.
   - **Directory**: type the **absolute path** from the table above (delete the auto-suggested `public_html/...` text first).
   - **Quota**: `Unlimited`.
3. Click **Create FTP Account**.
4. Repeat for `admin` and `db`.

> 🔑 The main cPanel login (`aronbdne`) is also a full-access FTP user. You can use it for everything in a pinch, but the dedicated accounts are safer.

### Connect from your Mac with FileZilla

1. Download **FileZilla** from `filezilla-project.org` and install.
2. **File → Site Manager → New Site** — create three sites, one per FTP account:

   | Field | Value |
   |---|---|
   | Protocol | `FTP – File Transfer Protocol` |
   | Host | `ftp.aronbd.net` |
   | Port | `21` |
   | Encryption | `Require explicit FTP over TLS` |
   | Logon Type | `Normal` |
   | User | `storefront@aronbd.net` *(or `admin@…` / `db@…`)* |
   | Password | *(generated above)* |

3. Click **Connect** and accept the TLS certificate.
4. Set an upload filter so you don't ship junk: **Edit → Filename filters → New** → check `node_modules` and `.next`, save the filter, enable it on the upload side.

If your host supports **SFTP** (port 22), prefer it — same hostname, use your main cPanel password.

---

## Step 6 — Prepare files locally and upload

### 6.1  One-time code changes (do these BEFORE uploading)

**(a) Make the DB path configurable.** Edit **both** `Admin/lib/db.ts` and `Arong/lib/db.ts`:

```ts
// before
const dbPath = path.resolve(process.cwd(), '..', 'db', 'arong.db');

// after
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(process.cwd(), '..', 'db', 'arong.db');
```

**(b) Add a `server.js` to BOTH `Admin/` and `Arong/`** (Passenger needs a single entry file):

```js
// server.js
const next = require('next');
const http = require('http');

const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
```

**(c) Build locally to catch errors:**
```bash
cd Admin && npm run build && cd ..
cd Arong && npm run build && cd ..
```
Fix any TypeScript errors before continuing.

### 6.2  Upload via FTP

In FileZilla:

1. Connect using the **`storefront@aronbd.net`** site → drag the **contents** of your local `Arong/` folder (NOT the folder itself — the files inside) into the right pane (which is rooted at `/home/aronbdne/apps/Arong`).
2. Disconnect, connect using **`admin@aronbd.net`** → upload the contents of local `Admin/` to the right pane.

The filter from step 5 keeps `node_modules` and `.next` off the wire. Upload should be a few MB, not a few hundred.

---

## Step 7 — Install dependencies and start the apps

Open **cPanel → Terminal**.

```bash
# Storefront
cd /home/aronbdne/apps/Arong
# Activate the Node env that cPanel created for this app:
source /home/aronbdne/nodevenv/apps/Arong/20/bin/activate
npm install --production=false
npm run build
```

```bash
# Admin
cd /home/aronbdne/apps/Admin
source /home/aronbdne/nodevenv/apps/Admin/20/bin/activate
npm install --production=false
npm run build
```

> The exact `source …/bin/activate` path is shown at the top of the Setup Node.js App screen for each app — copy from there if `20` is a different version on your server.

Now go back to **Setup Node.js App** and click **Restart** for both apps. Then visit:

- https://aronbd.net → storefront should load
- https://admin.aronbd.net → admin login should load

If you get a 502/503, check the Passenger log file path shown in the app config.

---

## Step 8 — Upload the SQLite database

1. On your Mac, make sure both local dev servers are stopped (so the file isn't locked).
2. In FileZilla, connect using the **`db@aronbd.net`** account.
3. Upload your local `db/arong.db` into the right pane (which lands in `/home/aronbdne/apps/db/`).
4. In **cPanel → Terminal**:
   ```bash
   chmod 755 /home/aronbdne/apps/db
   chmod 644 /home/aronbdne/apps/db/arong.db
   ```
5. Also upload existing product images:
   - Local `Arong/public/uploads/*` → server `/home/aronbdne/apps/Arong/public/uploads/`
   - Local `Admin/public/uploads/*` → server `/home/aronbdne/apps/Admin/public/uploads/`

Restart both Node apps after uploading the DB, then check that products show up at https://aronbd.net.

---

## Step 9 — SMTP setup

### 9.1  Create the mailbox

1. **cPanel → Email → Email Accounts → Create**.
2. Username: `noreply` → full address `noreply@aronbd.net`.
3. Strong password (save it).
4. Click **Create**.

### 9.2  Note the SMTP settings

In **Email Accounts**, click **Connect Devices** next to `noreply@aronbd.net`. Typical values:

| Setting | Value |
|---|---|
| SMTP server | `mail.aronbd.net` |
| Port | `465` (SSL/TLS) — or `587` (STARTTLS) |
| Username | `noreply@aronbd.net` (full address) |
| Password | *(the one you just set)* |

Update the `SMTP_PASS` env var for both Node apps in **Setup Node.js App** to match.

### 9.3  Verify SPF + DKIM

**cPanel → Email → Email Deliverability**. For `aronbd.net`, both should show ✅. If not, click **Manage → Install the Suggested Record**. Without these, your emails go to spam.

### 9.4  Wire SMTP into the Admin project

The codebase doesn't send emails yet. To enable:

1. Locally:
   ```bash
   cd Admin
   npm install nodemailer
   npm install -D @types/nodemailer
   ```
2. Create `Admin/lib/mailer.ts`:
   ```ts
   import nodemailer from 'nodemailer';

   export const mailer = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: Number(process.env.SMTP_PORT) || 465,
     secure: Number(process.env.SMTP_PORT) !== 587, // true for 465, false for 587
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });

   export async function sendMail(to: string, subject: string, html: string) {
     return mailer.sendMail({
       from: process.env.SMTP_FROM,
       to,
       subject,
       html,
     });
   }
   ```
3. Call `sendMail(...)` from your order-status update route.
4. Re-upload `Admin/` via FTP (step 6.2), re-run `npm install && npm run build` in Terminal (step 7), restart the app.

### 9.5  Test SMTP from the server

In cPanel **Terminal**:

```bash
cd /home/aronbdne/apps/Admin
source /home/aronbdne/nodevenv/apps/Admin/20/bin/activate
node -e "require('./lib/mailer').sendMail('your-personal@gmail.com','Test','<b>It works</b>').then(console.log).catch(console.error)"
```

If your Gmail receives the email, SMTP is working.

---

## Step 10 — Going forward

### Updating the site
1. Make changes locally, run `npm run build` to confirm it compiles.
2. FTP-upload only the changed app folder (filter still excludes `node_modules` / `.next`).
3. In Terminal: `npm install` (only if `package.json` changed) → `npm run build`.
4. **Setup Node.js App → Restart**.

### Daily DB backup (cron)
**cPanel → Advanced → Cron Jobs**, add a daily job:
```
0 3 * * *  /usr/bin/sqlite3 /home/aronbdne/apps/db/arong.db ".backup '/home/aronbdne/backups/arong-$(date +\%F).db'" && find /home/aronbdne/backups -name 'arong-*.db' -mtime +14 -delete
```
This runs at 03:00 and keeps 14 days of backups.

### HTTPS
**Security → SSL/TLS Status** should show green for both `aronbd.net` and `admin.aronbd.net`. If not, click **Run AutoSSL**.

---

## Quick reference

**Folder layout**
```
/home/aronbdne/apps/Admin    ← admin app  (admin.aronbd.net)
/home/aronbdne/apps/Arong    ← storefront (aronbd.net)
/home/aronbdne/apps/db       ← arong.db
/home/aronbdne/backups       ← daily DB backups
```

**FTP accounts**

| User | Folder |
|---|---|
| `storefront@aronbd.net` | `/home/aronbdne/apps/Arong` |
| `admin@aronbd.net`      | `/home/aronbdne/apps/Admin` |
| `db@aronbd.net`         | `/home/aronbdne/apps/db` |

**Env vars (set in both Node apps)**
```
NODE_ENV=production
DB_PATH=/home/aronbdne/apps/db/arong.db
SMTP_HOST=mail.aronbd.net
SMTP_PORT=465
SMTP_USER=noreply@aronbd.net
SMTP_PASS=*****
SMTP_FROM="ARON" <noreply@aronbd.net>
```
