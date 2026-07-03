export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const supplier = await prisma.supplier.findFirst({
      where: { id: params?.id ?? '', organizationId: auth.organizationId },
      include: {
        invoices: { orderBy: { invoiceDate: 'desc' }, include: { items: { include: { brand: true } } } },
        payments: { orderBy: { paymentDate: 'desc' }, include: { allocations: { include: { invoice: { select: { invoiceNo: true } } } } } },
        ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
    });
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const outstanding = supplier.invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    return NextResponse.json({ ...supplier, outstanding });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { name, contactPerson, phone, email, address, creditLimit, defaultCreditDays, isActive } = body ?? {};
    requireManager(auth);
    const owned = await prisma.supplier.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const supplier = await prisma.supplier.update({
      where: { id: params?.id ?? '' },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(contactPerson !== undefined ? { contactPerson } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(creditLimit !== undefined ? { creditLimit: parseFloat(creditLimit) || 0 } : {}),
        ...(defaultCreditDays !== undefined ? { defaultCreditDays: parseInt(defaultCreditDays) || 30 } : {}),
        ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      },
    });
    return NextResponse.json(supplier);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
