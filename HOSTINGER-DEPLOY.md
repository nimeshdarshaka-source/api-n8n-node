# Deploy SLDOCPP Clinic ERP on Hostinger

The app uses Next.js + MySQL, so deploy it as a Hostinger Node.js Web App, not
a static `public_html` upload.

## One-time preparation

### 1. Create the database (5 min)
1. hPanel → **Databases → MySQL Databases**
2. Create database `sldocpp_clinic`, a user, and a strong password — note all three
3. Your connection line looks like:
   `mysql://USER:PASSWORD@localhost:3306/sldocpp_clinic`

### 2. Deploy source
Use either GitHub import or upload the prepared ZIP.

Best: GitHub import.
1. Create a free account at **https://github.com**
2. Install **GitHub Desktop** (https://desktop.github.com), sign in
3. In GitHub Desktop: File → **Add local repository** → choose
   `C:\SLDOCPP\clinic_erp` (it will offer to "create a repository" — accept,
   keep defaults) → **Publish repository** → tick **Keep this code private** → Publish

Alternative: upload `clinic_erp-hostinger.zip` in hPanel when choosing file upload.

### 3. Create the Node.js app in Hostinger
1. hPanel → Websites → **Add Website**
2. Choose **Node.js Apps**
3. Choose **Import Git Repository** or **Upload your website files**
3. Pick the `clinic_erp` repository, branch `main`
4. Settings Hostinger asks for:
   - Framework: **Next.js**
   - Node.js version: **20**
   - Install command: `npm ci --legacy-peer-deps`
   - Build command: `npx prisma generate && npx prisma db push && npm run build`
   - Start command: `npm run start -- -p $PORT`
5. **Environment variables** (same screen):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | `mysql://USER:PASSWORD@localhost:3306/sldocpp_clinic` |
   | `NEXTAUTH_SECRET` | any long random text (30+ characters) |
   | `NEXTAUTH_URL` | `https://sldocpp.com` |
   | `PLATFORM_ADMIN_EMAILS` | `nimeshdarshakarandeniya@gmail.com` |
   | `BANK_TRANSFER_DETAILS` | your bank account details for customers |
   | `PAYHERE_MERCHANT_ID` | (when your PayHere account is ready) |
   | `PAYHERE_MERCHANT_SECRET` | (when your PayHere account is ready) |
   | `PAYHERE_MODE` | `sandbox` until PayHere approves you, then `live` |

6. Deploy. First build takes several minutes.

### 4. Connect your domain
1. Use `sldocpp.com` as the website domain during Node.js app creation, or connect
   it from the website dashboard after deploy.
2. If the domain is registered at Hostinger, DNS is usually automatic.
3. If the domain is elsewhere, point nameservers or add the A/CNAME record Hostinger
   shows in hPanel.
4. Wait for the green tick; Hostinger issues the free SSL certificate itself.

## Updating the app later
When the code changes: open GitHub Desktop → it shows the changed files →
write a short summary → **Commit to main** → **Push origin**.
Hostinger redeploys automatically.

## Local testing on your PC (optional)
1-SETUP.bat / 2-START.bat still work. For the database either:
- enable **Remote MySQL** in hPanel and put that address in `.env`, or
- keep a separate free Neon PostgreSQL for testing (change provider back).

## Loading demo data
After the first deploy, run locally (with Remote MySQL enabled):
`npx prisma db seed` — creates the Demo Clinic (demo@clinicpro.lk / demo1234).
