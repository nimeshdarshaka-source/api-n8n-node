export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const items = await prisma.inventoryItem.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { name: 'asc' },
      include: {
        brands: {
          include: {
            batches: {
              where: { remainingQty: { gt: 0 } },
              orderBy: { expiryDate: 'asc' },
              include: { supplier: { select: { name: true } } },
            },
          },
        },
      },
    });
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 90);
    const result = (items ?? []).map((item) => {
      const batches = item.brands.flatMap((b) => b.batches);
      const totalStock = batches.reduce((s, b) => s + b.remainingQty, 0);
      const stockValue = batches.reduce((s, b) => s + b.remainingQty * b.realUnitCost, 0);
      const expiredQty = batches.filter((b) => b.expiryDate < now).reduce((s, b) => s + b.remainingQty, 0);
      const expiringSoonQty = batches.filter((b) => b.expiryDate >= now && b.expiryDate <= soon).reduce((s, b) => s + b.remainingQty, 0);
      return { ...item, totalStock, stockValue, expiredQty, expiringSoonQty, lowStock: totalStock < item.minStock };
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
    const { name, category, unit, dosageForm, minStock, purchasePrice, sellingPrice } = body ?? {};
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const item = await prisma.inventoryItem.create({
      data: {
        organizationId: auth.organizationId,
        name,
        category: category ?? 'General',
        unit: unit ?? 'pcs',
        dosageForm: dosageForm ?? '',
        minStock: parseInt(minStock) || 10,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
      },
    });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
