export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

// Stock OUT (FEFO dispense) and ADJUSTMENT — one database transaction per blueprint:
// OUT: 1. Find eligible batches by FEFO  2. Deduct stock  3. Ledger OUT
//      4. Dispensed item record  5. Update cached item stock
export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { type } = body ?? {};

    if (type === 'OUT') {
      const { brandId, quantity, visitId, notes } = body ?? {};
      const qty = parseInt(quantity) || 0;
      if (!brandId || qty <= 0) return NextResponse.json({ error: 'Brand and positive quantity required' }, { status: 400 });

      const result = await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.findFirst({ where: { id: brandId, organizationId: auth.organizationId }, select: { itemId: true } });
        if (!brand) throw new Error('Brand not found');
        const today = new Date();
        // FEFO: First Expiry, First Out — exclude expired batches
        const batches = await tx.batch.findMany({
          where: { brandId, organizationId: auth.organizationId, remainingQty: { gt: 0 }, expiryDate: { gte: today }, status: 'active' },
          orderBy: { expiryDate: 'asc' },
        });
        const available = batches.reduce((s, b) => s + b.remainingQty, 0);
        if (available < qty) throw new Error(`Insufficient stock. Available (non-expired): ${available}`);

        let remaining = qty;
        const dispensed: any[] = [];
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.remainingQty);
          remaining -= take;

          const newRemaining = batch.remainingQty - take;
          await tx.batch.update({
            where: { id: batch.id },
            data: { remainingQty: newRemaining, status: newRemaining === 0 ? 'depleted' : 'active' },
          });
          await tx.stockLedger.create({
            data: {
              organizationId: auth.organizationId,
              itemId: brand.itemId,
              brandId,
              batchId: batch.id,
              movementType: 'OUT',
              qty: -take,
              unitCost: batch.realUnitCost,
              sellingPrice: batch.sellingPrice,
              referenceType: visitId ? 'visit' : 'dispense',
              referenceId: visitId ?? '',
              notes: notes ?? '',
            },
          });
          const d = await tx.dispensedItem.create({
            data: {
              organizationId: auth.organizationId,
              visitId: visitId ?? null,
              brandId,
              batchId: batch.id,
              qty: take,
              unitCost: batch.realUnitCost,
              sellingPrice: batch.sellingPrice,
              totalCost: take * batch.realUnitCost,
              totalSale: take * batch.sellingPrice,
              profit: take * (batch.sellingPrice - batch.realUnitCost),
            },
          });
          dispensed.push(d);
        }
        await tx.inventoryItem.update({
          where: { id: brand.itemId },
          data: { currentStock: { decrement: qty } },
        });
        return { dispensed, totalQty: qty };
      });
      await audit(auth, 'dispense', 'stock_ledger', brandId, `FEFO OUT qty ${qty}`);
      return NextResponse.json(result);
    }

    if (type === 'ADJUSTMENT' || type === 'EXPIRED' || type === 'RETURN') {
      const { batchId, quantity, notes } = body ?? {};
      const qtyChange = parseInt(quantity) || 0; // signed: negative = remove, positive = add back
      if (!batchId || qtyChange === 0) return NextResponse.json({ error: 'Batch and non-zero quantity required' }, { status: 400 });

      const result = await prisma.$transaction(async (tx) => {
        const batch = await tx.batch.findFirst({ where: { id: batchId, organizationId: auth.organizationId }, include: { brand: { select: { itemId: true } } } });
        if (!batch) throw new Error('Batch not found');
        const newRemaining = batch.remainingQty + qtyChange;
        if (newRemaining < 0) throw new Error('Adjustment would make batch stock negative');
        await tx.batch.update({
          where: { id: batchId },
          data: {
            remainingQty: newRemaining,
            status: type === 'EXPIRED' && newRemaining === 0 ? 'expired' : newRemaining === 0 ? 'depleted' : 'active',
          },
        });
        const ledger = await tx.stockLedger.create({
          data: {
            organizationId: auth.organizationId,
            itemId: batch.brand.itemId,
            brandId: batch.brandId,
            batchId,
            movementType: type,
            qty: qtyChange,
            unitCost: batch.realUnitCost,
            referenceType: 'adjustment',
            notes: notes ?? '',
          },
        });
        await tx.inventoryItem.update({
          where: { id: batch.brand.itemId },
          data: { currentStock: { increment: qtyChange } },
        });
        return ledger;
      });
      await audit(auth, 'adjust', 'stock_ledger', batchId, `${type} qty ${qtyChange}`);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'type must be OUT, ADJUSTMENT, RETURN or EXPIRED. Stock IN happens via supplier invoices (/api/purchases).' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
