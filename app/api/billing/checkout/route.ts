export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAuth, requireOwner, audit, errStatus } from '@/lib/tenant';
import { PLANS, priceFor } from '@/lib/billing';

// Body: { plan: 'basic'|'pro', months: 1|12, method: 'payhere'|'bank' }
export async function POST(req: Request) {
  try {
    const auth = await getAuth({ allowExpired: true });
    requireOwner(auth);
    const b = await req.json();
    const plan = String(b?.plan ?? '');
    const months = b?.months === 12 ? 12 : 1;
    const method = b?.method === 'bank' ? 'bank' : 'payhere';
    if (!PLANS[plan]) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    const amount = priceFor(plan, months);

    const payment = await prisma.billingPayment.create({
      data: { organizationId: auth.organizationId, plan, months, amount, method, status: 'pending' },
    });
    await audit(auth, 'create', 'billing_payments', payment.id, `${method} ${plan} x${months}m LKR ${amount}`);

    if (method === 'bank') {
      return NextResponse.json({ manual: true, paymentId: payment.id, amount, reference: payment.id.slice(-8).toUpperCase() });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const secret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantId || !secret) {
      return NextResponse.json({ error: 'PayHere is not configured yet — use bank transfer, or set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET' }, { status: 400 });
    }
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: auth.organizationId } });
    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const amountStr = amount.toFixed(2);
    const currency = 'LKR';
    // PayHere hash: MD5(merchant_id + order_id + amount + currency + MD5(secret).toUpperCase()).toUpperCase()
    const secretHash = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
    const hash = crypto.createHash('md5').update(merchantId + payment.id + amountStr + currency + secretHash).digest('hex').toUpperCase();

    return NextResponse.json({
      manual: false,
      action: process.env.PAYHERE_MODE === 'live' ? 'https://www.payhere.lk/pay/checkout' : 'https://sandbox.payhere.lk/pay/checkout',
      fields: {
        merchant_id: merchantId,
        return_url: `${base}/billing?status=success`,
        cancel_url: `${base}/billing?status=cancelled`,
        notify_url: `${base}/api/billing/notify`,
        order_id: payment.id,
        items: `ClinicPro ${PLANS[plan].name} — ${months} month(s)`,
        amount: amountStr,
        currency,
        hash,
        first_name: org.ownerName || 'Clinic',
        last_name: 'Owner',
        email: org.email || 'billing@example.com',
        phone: org.phone || '0000000000',
        address: org.address || 'Sri Lanka',
        city: 'Sri Lanka',
        country: 'Sri Lanka',
      },
    });
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
