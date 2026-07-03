export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// PayHere IPN (server-to-server). No session — verified by md5sig.
// Docs: status_code 2 = success. md5sig = MD5(merchant_id+order_id+payhere_amount+payhere_currency+status_code+MD5(secret).toUpperCase()).toUpperCase()
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const merchantId = String(form.get('merchant_id') ?? '');
    const orderId = String(form.get('order_id') ?? '');
    const amount = String(form.get('payhere_amount') ?? '');
    const currency = String(form.get('payhere_currency') ?? '');
    const statusCode = String(form.get('status_code') ?? '');
    const md5sig = String(form.get('md5sig') ?? '');
    const payhereId = String(form.get('payment_id') ?? '');

    const secret = process.env.PAYHERE_MERCHANT_SECRET ?? '';
    const secretHash = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
    const local = crypto.createHash('md5').update(merchantId + orderId + amount + currency + statusCode + secretHash).digest('hex').toUpperCase();
    if (!secret || local !== md5sig || merchantId !== process.env.PAYHERE_MERCHANT_ID) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const payment = await prisma.billingPayment.findUnique({ where: { id: orderId } });
    if (!payment) return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
    if (payment.status === 'confirmed') return NextResponse.json({ ok: true }); // idempotent

    if (statusCode === '2') {
      await prisma.$transaction(async (tx) => {
        await tx.billingPayment.update({
          where: { id: orderId },
          data: { status: 'confirmed', paidAt: new Date(), reference: payhereId },
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
            organizationId: org.id, userName: 'PayHere', action: 'pay', tableName: 'billing_payments',
            recordId: orderId, detail: `Payment confirmed LKR ${amount} — ${payment.plan} until ${newExpiry.toISOString().slice(0, 10)}`,
          },
        });
      });
    } else {
      await prisma.billingPayment.update({ where: { id: orderId }, data: { status: 'failed', reference: payhereId } });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: 500 });
  }
}
