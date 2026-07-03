# ClinicPro — Full Build (Phases 1–6 of the Clinic ERP Blueprint)

Single-clinic implementation of the blueprint. 26 database models, 21 API groups, 16 screens.

## Modules

### Phase 1 — Medical Center (original MVP)
Patients, doctors, services, visits with multi-service billing, expenses, dashboard.

### Phase 2 — Inventory + Supplier Finance
- Item (generic) -> Brand -> Batch hierarchy with expiry tracking
- Real Unit Cost = Total Paid Cost / (Purchased Qty + Free Qty)
- FEFO dispensing (First Expiry, First Out), expired batches excluded
- Stock ledger for every movement (IN / OUT / ADJUSTMENT / RETURN / EXPIRED)
- Supplier invoices -> batches + stock in one transaction
- Supplier payments with multi-invoice allocation (manual or oldest-first auto)
- Running supplier ledger, outstanding balances, credit limits
- Pages: /inventory, /suppliers, /purchases, /supplier-payments

### Phase 3 — Staff + Payroll
- Salary types: fixed monthly, daily rate, per-patient (doctor), % of revenue (doctor)
- Payroll generation reads attendance + salary rules + approved overtime
- Attendance-linked absence deductions (monthly staff, 26-day basis)
- Net = Base + Allowances + Bonuses + OT − Deductions − Advances
- Paid payroll auto-records a "Salaries" expense; paid rows are locked
- Pages: /staff, /payroll

### Phase 4 — Prescriptions -> FEFO stock deduction
- Prescription with brand/qty/dosage lines
- "Confirm & Dispense" runs the blueprint dispense transaction: FEFO batch selection,
  stock ledger OUT, dispensed-item profit records, item stock update
- OCR upload can be added later; manual entry is the correction screen
- Page: /prescriptions

### Phase 5 — Attendance
- Shifts with grace minutes; late detection on check-in
- PIN check-in/out (staff with a PIN get a PIN prompt) + manual fallback
- Leave requests with approval -> marks attendance days as leave
- Overtime records with rates -> feeds payroll
- Facial recognition intentionally NOT included (biometric consent required per
  blueprint); PIN is the compliant fallback. Add face scan as a device integration later.
- Page: /attendance

### Phase 6 — Reports
- Periods: today / yesterday / this+last week / this+last month / this+last year / custom
- Financial: income (consult + drug sales), COGS, expenses, salaries, supplier payments,
  net profit, margin; patient counts; avg income per visit
- Breakdowns: doctor-wise, service-wise, drug profit by brand, expense categories, payment mix
- CSV export
- Page: /reports

## Setup
1. Set `DATABASE_URL` in `.env` to your PostgreSQL database.
2. `npm install --legacy-peer-deps`
3. `npx prisma generate && npx prisma db push`
4. `npx prisma db seed` (optional demo data)
5. `npm run dev`

## Deliberately out of scope (next steps toward the SaaS blueprint)
- Multi-tenancy (Organization -> Clinic -> Branch + organization_id on every table,
  RBAC roles, tenant-scoped APIs) — do this before onboarding a second clinic
- Invoice/prescription OCR (Google Document AI) with confidence scoring
- Audit log table + record locking after day/payroll close
- PDF exports, scheduled reports, WhatsApp/SMS alerts, AI reorder suggestions
- Facial-scan attendance with biometric consent records

---

## Commercial SaaS layer (added July 2026)

The app is now multi-tenant — ready to sell to multiple clinics:

- **Organizations with hard data isolation.** Signing up creates an Organization;
  every table carries organization_id and every API query is scoped to the
  logged-in user's organization. Clinic A can never read Clinic B's data.
- **Self-service signup.** Any clinic owner registers with their clinic name and
  instantly gets an isolated workspace. Demo login after seeding:
  demo@clinicpro.lk / demo1234
- **Role-based access control.** owner > manager > staff. Purchases, supplier
  payments, payroll, staff management and supplier edits require manager/owner.
  Team logins are created by the owner in Settings → Team.
- **Audit log.** Stock dispensing/adjustments, invoices, supplier payments, payroll
  generation/payment and login creation are recorded with who/when/what
  (Settings → Audit Log, manager+ only).
- **Paid payroll locking** and 8-character password minimums.

### Still to add before charging money
1. Subscription billing (PayHere for Sri Lanka, or manual invoicing) — the
   Organization model already has a `plan` field to gate features on
2. Automated daily database backups (Neon paid tier has point-in-time restore)
3. Error monitoring (e.g. Sentry free tier) and uptime alerts
4. Terms of service + privacy policy (PDPA — patient data)
5. Email verification / password reset flow
6. Rate limiting on the login endpoint

### Important upgrade note
The database structure changed. If you created the database BEFORE this
version, run 1-SETUP.bat once more (it will rebuild the tables — old test data
is erased). Never run 1-SETUP.bat again after entering real clinic data.

---

## Billing module (added July 2026)

- **Plans** — Basic (3 logins) and Pro (unlimited), monthly or annual (pay 10
  months, get 12). **Edit your prices in `lib/billing.ts`** (PLANS constant).
- **14-day free trial** starts automatically at signup.
- **Enforcement** — expired subscriptions (after a 3-day grace period) are
  blocked from every API with a clear "renew on the Billing page" message.
  Plan user limits are enforced when creating team logins.
- **PayHere card payments** — hosted checkout with hash verification and a
  server-to-server notify webhook that activates the plan automatically.
- **Bank transfer** — owner picks Bank Transfer, gets your account details and a
  reference code; a pending payment is recorded. YOU confirm it by calling
  POST /api/billing/confirm with the paymentId while logged in with a
  platform-admin email — the plan activates and the audit log records it.
- **Billing page** (owner) — current plan, days left, plan cards, payment history.

### Billing environment variables (set in Vercel → Settings → Environment Variables)
| Name | Value |
|---|---|
| `PAYHERE_MERCHANT_ID` | from your payhere.lk merchant account |
| `PAYHERE_MERCHANT_SECRET` | from PayHere → Integrations |
| `PAYHERE_MODE` | `sandbox` for testing, `live` for real cards |
| `PLATFORM_ADMIN_EMAILS` | your email, e.g. `nimeshdarshakarandeniya@gmail.com` |
| `BANK_TRANSFER_DETAILS` | e.g. `Commercial Bank, Chilaw — Acc 8001234567 — Your Name` |

PayHere sign-up: https://www.payhere.lk — register as a merchant, complete KYC,
then copy the merchant ID and secret. Until then, bank transfer works out of the box.

Note: the database structure changed again — run 1-SETUP.bat once more before
deploying (erases test data; never run it after real data exists).

---

## Hosting switch (July 2026): all-in Hostinger

The database layer was converted from PostgreSQL to **MySQL** so the entire
product runs on the owner's Hostinger Business plan (app via Node.js hosting,
database via hPanel MySQL, daily backups included). See **HOSTINGER-DEPLOY.md**
for the step-by-step deployment. The Vercel flow (3-DEPLOY.bat / DEPLOY-GUIDE.md)
still works but is no longer the primary path.
