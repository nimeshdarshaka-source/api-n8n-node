export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { name: 'asc' },
      include: {
        invoices: { select: { netTotal: true, paidAmount: true, balanceAmount: true, status: true } },
        _count: { select: { invoices: true, payments: true } },
      },
    });
    const result = (suppliers ?? []).map((s) => {
      const outstanding = s.invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
      const totalPurchases = s.invoices.reduce((sum, inv) => sum + inv.netTotal, 0);
      const { invoices, ...rest } = s;
      return { ...rest, outstanding, totalPurchases };
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { name, contactPerson, phone, email, address, creditLimit, defaultCreditDays } = body ?? {};
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const supplier = await prisma.supplier.create({
      data: {
        organizationId: auth.organizationId,
        name,
        contactPerson: contactPerson ?? '',
        phone: phone ?? '',
        email: email ?? '',
        address: address ?? '',
        creditLimit: parseFloat(creditLimit) || 0,
        defaultCreditDays: parseInt(defaultCreditDays) || 30,
      },
    });
    return NextResponse.json(supplier);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
