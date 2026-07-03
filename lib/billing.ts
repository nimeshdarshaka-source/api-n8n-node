// ---- EDIT YOUR PRICES AND BANK DETAILS HERE ----
export const PLANS: Record<string, { name: string; monthlyLkr: number; maxUsers: number; blurb: string }> = {
  basic: { name: 'Basic', monthlyLkr: 2999, maxUsers: 3, blurb: 'Single doctor practice — visits, inventory, suppliers, reports' },
  pro:   { name: 'Pro',   monthlyLkr: 5999, maxUsers: 999, blurb: 'Full clinic — everything in Basic plus payroll, attendance, unlimited team logins' },
};
export const TRIAL_DAYS = 14;
export const GRACE_DAYS = 3; // days after expiry before access is blocked
export const ANNUAL_MONTHS_CHARGED = 10; // pay 10 months, get 12
export const BANK_TRANSFER_DETAILS =
  process.env.BANK_TRANSFER_DETAILS ??
  'Bank transfer details not configured yet. Set BANK_TRANSFER_DETAILS in your environment (e.g. "Commercial Bank, Chilaw — Acc 8001234567 — SLDOC (Pvt) Ltd").';
// ------------------------------------------------

export function priceFor(plan: string, months: number): number {
  const p = PLANS[plan];
  if (!p) return 0;
  const charged = months === 12 ? ANNUAL_MONTHS_CHARGED : months;
  return p.monthlyLkr * charged;
}

export function planState(org: { plan: string; status: string; planExpiresAt: Date | null }) {
  const now = Date.now();
  const exp = org.planExpiresAt ? new Date(org.planExpiresAt).getTime() : 0;
  const daysLeft = exp ? Math.ceil((exp - now) / 86400000) : 0;
  const blocked = org.status !== 'active' || (exp > 0 && now > exp + GRACE_DAYS * 86400000);
  return { plan: org.plan, expiresAt: org.planExpiresAt, daysLeft, expired: exp > 0 && now > exp, blocked };
}
