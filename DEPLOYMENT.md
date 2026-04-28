# ARON — Deployment Guide (cPanel Shared Hosting)

Domain: **aronbd.net**  •  cPanel user: **aronbdne**  •  Home: `/home/aronbdne`

This guide is in **strict order** — do every step in the sequence shown.

| Step | What you do | Where |
|---|---|---|
| 1 | Pre-flight checks | cPanel home |
| 2 | Create the `admin.aronbd.net` subdomain | cPanel → Domains |
| 3 | Set up the folder layout on the server | cPanel → File Manager |
| 4 | Create MySQL database + user | cPanel → MySQL Databases |
| 5 | Import the database schema | cPanel → phpMyAdmin |
| 6 | Create the two Node.js apps + set env vars | cPanel → Setup Node.js App |
| 7 | Create FTP accounts (one per folder) | cPanel → FTP Accounts |
| 8 | Prepare files locally and upload via FTP | Your Mac → server |
| 9 | Build & start the apps | cPanel Terminal |
| 10 | Upload product images | FTP / File Manager |
| 11 | Configure SMTP and verify deliverability | cPanel → Email |
| 12 | Maintenance: backups, updates, SSL | cPanel |

> ✅ **Why MySQL?** This project uses **`mysql2`** (pure JavaScript, no C++ compilation). It works on any cPanel plan with Node.js Selector and MySQL — no `gcc`/`g++` needed.

---

## Step 1 — Pre-flight checklist

Open cPanel and confirm all of the following:

- [ ] **Software → Setup Node.js App** (a.k.a. "Node.js Selector") exists.
- [ ] **Software → Terminal** is available (needed to run `npm install` and `npm run build`).
- [ ] Node.js version **20.x** or newer is in the version dropdown.
- [ ] **Databases → MySQL Databases** is present.
- [ ] **Databases → phpMyAdmin** is present.
- [ ] **Files → File Manager** and **Files → FTP Accounts** are present.
- [ ] **Domains → Domains** (or → Subdomains) is present.
- [ ] **Email → Email Accounts** and **Email → Email Deliverability** exist.

If Node.js Selector is missing, open a support ticket: *"Please enable Node.js Selector and shell access."* Wait for confirmation before continuing.

---

## Step 2 — Create the `admin.aronbd.net` subdomain (do this FIRST)

The subdomain must exist before you create the Node app.

1. **cPanel → Domains → Domains** → click **Create A New Domain** (older cPanel: **Domains → Subdomains**).
2. Fill in:
   - **Domain**: `admin.aronbd.net`
   - **Share document root with "aronbd.net"**: ❌ **uncheck**.
   - **Document Root**: `/home/aronbdne/apps/Admin/public`
3. Click **Submit**.
4. Wait 2–5 minutes, then visit `http://admin.aronbd.net` — you should see an empty index or "Index of /".

> **If DNS is on Cloudflare:** add an `A` record: `admin → 107.181.234.46`, proxy OFF until SSL verifies.

---

## Step 3 — Create the folder layout on the server

Open **cPanel → File Manager**, navigate to `/home/aronbdne`, and create:

```
/home/aronbdne/
├── apps/
│   ├── Admin/        ← admin Next.js app
│   └── Arong/        ← storefront Next.js app
└── backups/          ← daily DB backups (step 12)
```

> ✅ Keep `apps/` **outside** `public_html` so your source code isn't served over HTTP.

---

## Step 4 — Create MySQL database + user

1. **cPanel → Databases → MySQL Databases**.

2. **Create New Database**:
   - Database name: `aron` → full name becomes `aronbdne_aron`
   - Click **Create Database**.

3. **MySQL Users → Add New User**:
   - Username: `aronapp` → full name `aronbdne_aronapp`
   - Password: click **Password Generator**, copy the password.
   - Click **Create User**.

4. **Add User To Database**:
   - User: `aronbdne_aronapp`
   - Database: `aronbdne_aron`
   - Privileges: tick **ALL PRIVILEGES**
   - Click **Make Changes**.

> 📝 Save these values — you need them in Step 6:
> - `DB_HOST` = `localhost`
> - `DB_USER` = `aronbdne_aronapp`
> - `DB_PASS` = *(^hSVA&~D=YJcutO!)*
> - `DB_NAME` = `aronbdne_aron`

---

## Step 5 — Import the database schema

1. **cPanel → Databases → phpMyAdmin**.
2. In the left sidebar, click the `aronbdne_aron` database.
3. Click the **Import** tab at the top.
4. Click **Choose File** and select `db/schema.sql` from your local project.
5. Click **Go**.

All 8 tables will be created: `categories`, `products`, `product_images`, `product_variants`, `coupons`, `coupon_targets`, `announcements`, `orders`, `order_items`.

> ✅ Verify: click the database in the left sidebar — you should see all 8 tables listed.

---

## Step 6 — Create the two Node.js apps + set environment variables

### 6.1  Create the storefront Node app

1. **cPanel → Setup Node.js App → Create Application**.
2. Settings:
   - **Node.js version**: `22.x` (or latest available).
   - **Application mode**: `Production`.
   - **Application root**: `apps/Arong`
   - **Application URL**: `aronbd.net`
   - **Application startup file**: `server.js`
3. Click **Create**.
4. In **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DB_HOST` | `localhost` |
   | `DB_USER` | `aronbdne_aronapp` |
   | `DB_PASS` | *(from step 4)* |
   | `DB_NAME` | `aronbdne_aron` |
   | `SMTP_HOST` | `mail.aronbd.net` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `noreply@aronbd.net` |
   | `SMTP_PASS` | *(filled in step 11)* |
   | `SMTP_FROM` | `noreply@aronbd.net` |
   | `SMTP_FROM_NAME` | `Arong` |
   | `BRAND_NAME` | `Arong` |

5. Click **Save**. Don't start the app yet.

### 6.2  Create the admin Node app

Repeat 6.1 with:
- **Application root**: `apps/Admin`
- **Application URL**: `admin.aronbd.net`
- **Startup file**: `server.js`
- Same environment variables PLUS:

  | Name | Value |
  |---|---|
  | `ADMIN_USERNAME` | `admin` |
  | `ADMIN_PASSWORD` | *(strong password)* |
  | `SESSION_SECRET` | *(random 32+ char string)* |

---

## Step 7 — Create FTP accounts

Create **two** FTP accounts (one per app):

| FTP user | Jailed directory |
|---|---|
| `storefront@aronbd.net` | `/home/aronbdne/apps/Arong` |
| `admin@aronbd.net`      | `/home/aronbdne/apps/Admin` |

For each: **cPanel → Files → FTP Accounts → Add FTP Account** → set directory, unlimited quota.

### Connect from your Mac (FileZilla)

1. Open FileZilla → **File → Site Manager → New Site** for each account.
2. Protocol: `FTP`, Host: `ftp.aronbd.net`, Port: `21`, Encryption: `Require explicit FTP over TLS`.
3. Set upload filter to exclude `node_modules` and `.next`.

---

## Step 8 — Prepare files locally and upload

### 8.1  Build locally first

```bash
cd /path/to/Arong

# Storefront
cd Arong
npm install
npm run build
cd ..

# Admin
cd Admin
npm install
npm run build
cd ..
```

Fix any TypeScript errors before uploading.

### 8.2  Upload via FTP

- Connect as `storefront@aronbd.net` → upload contents of local `Arong/` into the right pane.
- Connect as `admin@aronbd.net` → upload contents of local `Admin/` into the right pane.

**Do NOT upload:** `node_modules/`, `.next/`, `.env.local` (env vars are set in cPanel, not files).

---

## Step 9 — Install dependencies and build on the server

Open **cPanel → Terminal**.

```bash
# Storefront
cd /home/aronbdne/apps/Arong
source /home/aronbdne/nodevenv/apps/Arong/22/bin/activate
npm install --production=false
npm run build
```

```bash
# Admin
cd /home/aronbdne/apps/Admin
source /home/aronbdne/nodevenv/apps/Admin/22/bin/activate
npm install --production=false
npm run build
```

> The exact `source …/bin/activate` path is shown at the top of the **Setup Node.js App** screen for each app.

Now go to **Setup Node.js App** → click **Restart** for both apps. Then visit:

- `https://aronbd.net` → storefront should load
- `https://admin.aronbd.net` → admin login should load

If you get a 502/503, check the Passenger error log shown in the app config.

---

## Step 10 — Upload product images

```bash
# In FileZilla (storefront account):
# Local: Arong/public/uploads/*
# Remote: /home/aronbdne/apps/Arong/public/uploads/
```

```bash
# In cPanel Terminal — fix permissions:
chmod -R 755 /home/aronbdne/apps/Arong/public/uploads
```

---

## Step 11 — SMTP setup

### 11.1  Create the mailbox

1. **cPanel → Email → Email Accounts → Create**.
2. Username: `noreply` → full address `noreply@aronbd.net`.
3. Strong password (save it).

### 11.2  Update the SMTP_PASS env var

In **Setup Node.js App**, for **both** apps, update:
- `SMTP_PASS` = *(the mailbox password)*

Click **Save** → **Restart** both apps.

### 11.3  Verify SPF + DKIM

**cPanel → Email → Email Deliverability** → both domains should show ✅. If not, click **Manage → Install the Suggested Record**.

---

## Step 12 — Going forward

### Updating the site

1. Make changes locally, run `npm run build` to confirm it compiles.
2. FTP-upload only the changed app folder (filter still excludes `node_modules` / `.next`).
3. In Terminal: `npm install` (only if `package.json` changed) → `npm run build`.
4. **Setup Node.js App → Restart**.

### Daily MySQL backup (cron)

**cPanel → Advanced → Cron Jobs**, add a daily job:

```
0 3 * * *  mysqldump -u aronbdne_aronapp -p'PASSWORD' aronbdne_aron | gzip > /home/aronbdne/backups/aron-$(date +\%F).sql.gz && find /home/aronbdne/backups -name 'aron-*.sql.gz' -mtime +14 -delete
```

Replace `PASSWORD` with the actual DB password. This runs at 03:00 and keeps 14 days of backups.

### HTTPS

**Security → SSL/TLS Status** should show green for both domains. If not, click **Run AutoSSL**.

---

## Quick reference

### Folder layout

```
/home/aronbdne/apps/Admin    ← admin app  (admin.aronbd.net, port 3001)
/home/aronbdne/apps/Arong    ← storefront (aronbd.net,       port 3000)
/home/aronbdne/backups/      ← daily SQL backups
```

### MySQL database

| Setting | Value |
|---|---|
| Host | `localhost` |
| Database | `aronbdne_aron` |
| User | `aronbdne_aronapp` |

### Environment variables (both apps)

```
NODE_ENV=production
DB_HOST=localhost
DB_USER=aronbdne_aronapp
DB_PASS=<your_db_password>
DB_NAME=aronbdne_aron
SMTP_HOST=mail.aronbd.net
SMTP_PORT=465
SMTP_USER=noreply@aronbd.net
SMTP_PASS=<your_smtp_password>
SMTP_FROM=noreply@aronbd.net
SMTP_FROM_NAME=Arong
BRAND_NAME=Arong
```

### Additional (Admin app only)

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong_password>
SESSION_SECRET=<random_32+_char_string>
```

### FTP accounts

| User | Folder |
|---|---|
| `storefront@aronbd.net` | `/home/aronbdne/apps/Arong` |
| `admin@aronbd.net`      | `/home/aronbdne/apps/Admin` |
