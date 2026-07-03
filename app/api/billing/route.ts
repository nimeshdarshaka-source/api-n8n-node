export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, errStatus } from '@/lib/tenant';
import { PLANS, planState, BANK_TRANSFER_DETAILS, ANNUAL_MONTHS_CHARGED } from '@/lib/billing';

export async function GET() {
  try {
    const auth = await getAuth({ allowExpired: true });
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: auth.organizationId } });
    const payments = await prisma.billingPayment.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({
      org: { name: org.name, plan: org.plan, status: org.status, planExpiresAt: org.planExpiresAt },
      state: planState(org),
      plans: PLANS,
      annualMonthsCharged: ANNUAL_MONTHS_CHARGED,
      bankDetails: BANK_TRANSFER_DETAILS,
      payhereConfigured: !!process.env.PAYHERE_MERCHANT_ID,
      payments,
      role: auth.role,
    });
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
