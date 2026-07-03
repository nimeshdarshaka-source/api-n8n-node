export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const item = await prisma.inventoryItem.findFirst({
      where: { id: params?.id ?? '', organizationId: auth.organizationId },
      include: {
        brands: {
          include: {
            batches: { orderBy: { expiryDate: 'asc' }, include: { supplier: { select: { name: true } } } },
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { brand: { select: { name: true } }, batch: { select: { batchNumber: true } } },
        },
      },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
