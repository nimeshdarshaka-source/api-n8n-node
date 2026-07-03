export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const invoice = await prisma.supplierInvoice.findFirst({
      where: { id: params?.id ?? '', organizationId: auth.organizationId },
      include: {
        supplier: true,
        items: { include: { brand: { include: { item: { select: { name: true, unit: true } } } }, batch: { select: { id: true, remainingQty: true } } } },
        allocations: { include: { payment: true } },
      },
    });
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
