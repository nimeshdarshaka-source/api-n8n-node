export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Platform-admin endpoint: YOU (the vendor) confirm manual bank transfers.
// Set PLATFORM_ADMIN_EMAILS="you@example.com,other@example.com" in the environment.
// Body: { paymentId, reference? }
export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    const email = session?.user?.email ?? '';
    const admins = (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!email || !admins.includes(email.toLowerCase())) {
      return NextResponse.json({ error: 'Platform admin only' }, { status: 403 });
    }
    const b = await req.json();
    const payment = await prisma.billingPayment.findUnique({ where: { id: b?.paymentId ?? '' } });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (payment.status === 'confirmed') return NextResponse.json({ ok: true, already: true });

    const result = await prisma.$transaction(async (tx) => {
      await tx.billingPayment.update({
        where: { id: payment.id },
        data: { status: 'confirmed', paidAt: new Date(), reference: b?.reference ?? payment.reference },
      });
      const org = await tx.organization.findUniqueOrThrow({ where: { id: payment.organizationId } });
      const baseTime = Math.max(Date.now(), org.planExpiresAt ? new Date(org.planExpiresAt).getTime() : 0);
      const newExpiry = new Date(baseTime + payment.months * 30 * 86400000);
      await tx.organization.update({
        where: { id: org.id },
        data: { plan: payment.plan, planExpiresAt: newExpiry, status: 'active' },
      });
      await tx.auditLog.create({
        data: {
          organizationId: org.id, userName: email, action: 'approve', tableName: 'billing_payments',
          recordId: payment.id, detail: `Bank transfer confirmed — ${payment.plan} until ${newExpiry.toISOString().slice(0, 10)}`,
        },
      });
      return newExpiry;
    });
    return NextResponse.json({ ok: true, planExpiresAt: result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: 500 });
  }
}
