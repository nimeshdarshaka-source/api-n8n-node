export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const brands = await prisma.brand.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { name: 'asc' },
      include: {
        item: { select: { name: true, unit: true, category: true } },
        batches: { where: { remainingQty: { gt: 0 } }, select: { remainingQty: true, expiryDate: true, sellingPrice: true } },
      },
    });
    const result = (brands ?? []).map((b) => ({
      ...b,
      totalStock: b.batches.reduce((s, x) => s + x.remainingQty, 0),
    }));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { itemId, name, strength, manufacturer, defaultSellingPrice } = body ?? {};
    if (!itemId || !name) return NextResponse.json({ error: 'Item and brand name required' }, { status: 400 });
    const itemOk = await prisma.inventoryItem.findFirst({ where: { id: itemId, organizationId: auth.organizationId }, select: { id: true } });
    if (!itemOk) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    const brand = await prisma.brand.create({
      data: {
        organizationId: auth.organizationId,
        itemId,
        name,
        strength: strength ?? '',
        manufacturer: manufacturer ?? '',
        defaultSellingPrice: parseFloat(defaultSellingPrice) || 0,
      },
    });
    return NextResponse.json(brand);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
