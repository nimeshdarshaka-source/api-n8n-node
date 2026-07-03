# ClinicPro — Run it on YOUR computer with live editing

When running locally the app is in development mode: **edit any file, save,
and the browser updates in about a second.** No restart needed.

Steps 1–3 are done ONCE.

## Step 1 — Install Node.js
https://nodejs.org → green **LTS** button → install with all defaults.

## Step 2 — Install XAMPP (gives you a local MySQL database)
1. https://www.apachefriends.org → Download for Windows → install (defaults are fine)
2. Open **XAMPP Control Panel** → click **Start** next to **MySQL**
3. Click **Admin** next to MySQL (opens phpMyAdmin in the browser)
4. Click **New** in the left column → database name: `clinicpro` → **Create**

That's all — the `.env` file is already set for XAMPP
(`mysql://root:@localhost:3306/clinicpro`).

## Step 3 — Run the setup once
Double-click **1-SETUP.bat** in C:\SLDOCPP\clinic_erp. Wait for SETUP COMPLETE.
(MySQL must be running in XAMPP whenever you use the app.)

## Step 4 — Daily use / live editing
1. XAMPP Control Panel → Start **MySQL** (if not already green)
2. Double-click **2-START.bat** → browser opens http://localhost:3000
3. Log in with the demo account (demo@clinicpro.lk / demo1234) or sign up
4. **Live editing:** open any file under `C:\SLDOCPP\clinic_erp\app\`
   (each screen is a `page.tsx`; colors/theme are in `app\globals.css` and
   `tailwind.config.ts`), change it, save — the page refreshes itself.

### Easiest ways to edit the interface
- **Ask me (Claude) in this chat** — "make the sidebar dark blue",
  "add a blood-pressure field to the patient form" — I edit the files in your
  folder and, if 2-START.bat is running, you see the change live.
- Or install **VS Code** (https://code.visualstudio.com) and open the
  clinic_erp folder to edit by hand.

### Where things are
| What | File |
|---|---|
| Colors / theme | `app/globals.css`, `tailwind.config.ts` |
| Sidebar menu | `components/clinic-sidebar.tsx` |
| Each screen | `app/<name>/page.tsx` (e.g. `app/inventory/page.tsx`) |
| Prices/plans | `lib/billing.ts` |
| Database tables | `prisma/schema.prisma` |

Local data lives in XAMPP's MySQL on your PC — separate from the Hostinger
production database, so you can experiment freely. When an interface change is
ready for customers: GitHub Desktop → Commit → Push, and Hostinger redeploys.
