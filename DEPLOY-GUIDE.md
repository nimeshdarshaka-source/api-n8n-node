# Put ClinicPro on the internet — sldocpp.22millennial.com

After this, staff can use the app from any computer or phone at
**https://sldocpp.22millennial.com** with a login. Hosting (Vercel) and the
database (Neon) are both free to start.

**Do the local SETUP-GUIDE first** — you need the Neon database from its Step 2.

---

## Step 1 — Create a free Vercel account
Go to **https://vercel.com** → Sign Up → "Continue with Google" (or email).

## Step 2 — First deploy
Double-click **3-DEPLOY.bat** in C:\SLDOCPP\clinic_erp.
- A browser may open asking you to confirm the Vercel login — approve it
- Back in the black window, press ENTER for every question (defaults are fine)
- At the end it prints a URL like `https://clinic-erp-xxxx.vercel.app` — the site
  exists now but will show errors until Step 3.

## Step 3 — Give the app its settings (one time)
1. Go to **https://vercel.com/dashboard** → click your **clinic-erp** project
2. **Settings → Environment Variables** → add these three:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the same `postgresql://...` text from your `.env` file (from neon.tech) |
   | `NEXTAUTH_SECRET` | any long random text, e.g. 30+ random letters and numbers |
   | `NEXTAUTH_URL` | `https://sldocpp.22millennial.com` |

3. Double-click **3-DEPLOY.bat** once more so the settings take effect.

## Step 4 — Connect your subdomain
1. In the Vercel project: **Settings → Domains** → type
   `sldocpp.22millennial.com` → **Add**
2. Vercel shows what DNS record it needs — normally a **CNAME** pointing to
   `cname.vercel-dns.com`
3. Go to wherever you manage **22millennial.com** (e.g. Hostinger hPanel →
   Domains → 22millennial.com → **DNS / Name Servers → DNS records**) and add:

   | Type | Name | Points to / Target | TTL |
   |---|---|---|---|
   | CNAME | `sldocpp` | `cname.vercel-dns.com` | default |

4. Wait 10–60 minutes. Vercel verifies it automatically and issues the HTTPS
   padlock for you. When the Domains page shows a green check, open
   **https://sldocpp.22millennial.com** — done.

---

## Good to know
- **Updates:** whenever I change the app for you, just run 3-DEPLOY.bat again.
- **Same data everywhere:** the local app and the online app share the Neon
  database, so records match.
- **Security reminders:** this will hold real patient data —
  use a strong password for every account, don't share logins, and keep the
  list of people with accounts short. Before entering real patient data,
  consider your obligations under Sri Lanka's Personal Data Protection Act.
- **Costs:** Vercel and Neon free tiers are fine for one clinic. If usage grows,
  Neon's paid tier is the first thing you'd need.
