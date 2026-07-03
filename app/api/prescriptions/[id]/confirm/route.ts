export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

// Dispense Drug — one database transaction per blueprint:
// 1. Confirm prescription items  2. Find eligible batches by FEFO  3. Deduct stock
// 4. Stock ledger OUT  5. Dispensed item records  6. Mark prescription dispensed
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const result = await prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId }, include: { items: true } });
      if (!rx) throw new Error('Prescription not found');
      if (rx.status === 'dispensed') throw new Error('Prescription already dispensed');
      const today = new Date();

      for (const item of rx.items.filter((i) => i.status === 'pending')) {
        const brand = await tx.brand.findFirst({ where: { id: item.brandId, organizationId: auth.organizationId }, select: { itemId: true } });
        if (!brand) throw new Error('Brand not found');
        const batches = await tx.batch.findMany({
          where: { brandId: item.brandId, organizationId: auth.organizationId, remainingQty: { gt: 0 }, expiryDate: { gte: today }, status: 'active' },
          orderBy: { expiryDate: 'asc' }, // FEFO
        });
        const available = batches.reduce((s, x) => s + x.remainingQty, 0);
        if (available < item.qty) throw new Error(`Insufficient stock for item (need ${item.qty}, have ${available})`);

        let remaining = item.qty;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.remainingQty);
          remaining -= take;
          const newRem = batch.remainingQty - take;
          await tx.batch.update({ where: { id: batch.id }, data: { remainingQty: newRem, status: newRem === 0 ? 'depleted' : 'active' } });
          await tx.stockLedger.create({
            data: {
              organizationId: auth.organizationId,
              itemId: brand.itemId, brandId: item.brandId, batchId: batch.id,
              movementType: 'OUT', qty: -take, unitCost: batch.realUnitCost, sellingPrice: batch.sellingPrice,
              referenceType: 'prescription', referenceId: rx.id, notes: `Rx ${rx.id.slice(-6)}`,
            },
          });
          await tx.dispensedItem.create({
            data: {
              organizationId: auth.organizationId,
              visitId: rx.visitId, brandId: item.brandId, batchId: batch.id, qty: take,
              unitCost: batch.realUnitCost, sellingPrice: batch.sellingPrice,
              totalCost: take * batch.realUnitCost, totalSale: take * batch.sellingPrice,
              profit: take * (batch.sellingPrice - batch.realUnitCost),
            },
          });
        }
        await tx.inventoryItem.update({ where: { id: brand.itemId }, data: { currentStock: { decrement: item.qty } } });
        await tx.prescriptionItem.update({ where: { id: item.id }, data: { status: 'dispensed' } });
      }

      return tx.prescription.update({ where: { id: rx.id }, data: { status: 'dispensed' }, include: { items: true } });
    });
    await audit(auth, 'dispense', 'prescriptions', result.id, 'Prescription dispensed via FEFO');
    return NextResponse.json(result);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
