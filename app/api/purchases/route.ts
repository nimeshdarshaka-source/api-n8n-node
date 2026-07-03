export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const invoices = await prisma.supplierInvoice.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { invoiceDate: 'desc' },
      include: {
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });
    return NextResponse.json(invoices ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

// Supplier Invoice Approval — one database transaction per blueprint:
// 1. Create invoice  2. Create items  3. Create batches  4. Stock ledger IN
// 5. Supplier ledger debit  6. Update cached item stock
export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { supplierId, invoiceNo, invoiceDate, dueDate, discount, notes, items } = body ?? {};
    requireManager(auth);
    if (!supplierId || !invoiceNo || !invoiceDate || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Supplier, invoice no, date and at least one item are required' }, { status: 400 });
    }

    // Normalize + validate items
    const parsedItems = items.map((it: any) => {
      const purchasedQty = parseInt(it.purchasedQty) || 0;
      const freeQty = parseInt(it.freeQty) || 0;
      const unitPrice = parseFloat(it.unitPrice) || 0;
      const totalPaidCost = it.totalPaidCost !== undefined && it.totalPaidCost !== ''
        ? parseFloat(it.totalPaidCost) || 0
        : purchasedQty * unitPrice;
      const totalQty = purchasedQty + freeQty;
      // Real Unit Cost = Total Paid Cost / (Purchased Qty + Free Qty)
      const realUnitCost = totalQty > 0 ? totalPaidCost / totalQty : 0;
      return {
        brandId: it.brandId as string,
        batchNumber: (it.batchNumber ?? '') as string,
        expiryDate: new Date(it.expiryDate),
        purchasedQty, freeQty, totalQty, unitPrice, totalPaidCost, realUnitCost,
        sellingPrice: parseFloat(it.sellingPrice) || 0,
      };
    });
    for (const it of parsedItems) {
      if (!it.brandId || !it.batchNumber || it.purchasedQty <= 0 || isNaN(it.expiryDate.getTime())) {
        return NextResponse.json({ error: 'Each item needs brand, batch number, expiry date and purchased qty' }, { status: 400 });
      }
    }

    const supOk = await prisma.supplier.findFirst({ where: { id: supplierId, organizationId: auth.organizationId }, select: { id: true } });
    if (!supOk) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    const grossTotal = parsedItems.reduce((s, it) => s + it.totalPaidCost, 0);
    const disc = parseFloat(discount) || 0;
    const netTotal = grossTotal - disc;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Invoice
      const invoice = await tx.supplierInvoice.create({
        data: {
          organizationId: auth.organizationId,
          supplierId,
          invoiceNo,
          invoiceDate: new Date(invoiceDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          grossTotal,
          discount: disc,
          netTotal,
          paidAmount: 0,
          balanceAmount: netTotal,
          status: 'unpaid',
          notes: notes ?? '',
        },
      });

      for (const it of parsedItems) {
        // 2. Invoice item
        const invItem = await tx.supplierInvoiceItem.create({
          data: { invoiceId: invoice.id, ...it },
        });
        // 3. Batch
        const brand = await tx.brand.findFirst({ where: { id: it.brandId, organizationId: auth.organizationId }, select: { itemId: true } });
        if (!brand) throw new Error('Brand not found');
        const batch = await tx.batch.create({
          data: {
            organizationId: auth.organizationId,
            brandId: it.brandId,
            supplierId,
            invoiceItemId: invItem.id,
            batchNumber: it.batchNumber,
            expiryDate: it.expiryDate,
            purchasedQty: it.purchasedQty,
            freeQty: it.freeQty,
            totalQty: it.totalQty,
            remainingQty: it.totalQty,
            totalPaidCost: it.totalPaidCost,
            realUnitCost: it.realUnitCost,
            sellingPrice: it.sellingPrice,
            receivedDate: new Date(invoiceDate),
          },
        });
        // 4. Stock ledger IN
        await tx.stockLedger.create({
          data: {
            organizationId: auth.organizationId,
            itemId: brand.itemId,
            brandId: it.brandId,
            batchId: batch.id,
            movementType: 'IN',
            qty: it.totalQty,
            unitCost: it.realUnitCost,
            sellingPrice: it.sellingPrice,
            referenceType: 'invoice',
            referenceId: invoice.id,
            notes: `Invoice ${invoiceNo}`,
          },
        });
        // 6. Cached item stock
        await tx.inventoryItem.update({
          where: { id: brand.itemId },
          data: { currentStock: { increment: it.totalQty }, purchasePrice: it.realUnitCost },
        });
      }

      // 5. Supplier ledger debit
      const last = await tx.supplierLedger.findFirst({
        where: { supplierId },
        orderBy: { createdAt: 'desc' },
      });
      const runningBalance = (last?.runningBalance ?? 0) + netTotal;
      await tx.supplierLedger.create({
        data: {
          organizationId: auth.organizationId,
          supplierId,
          date: new Date(invoiceDate),
          transactionType: 'invoice',
          debit: netTotal,
          credit: 0,
          runningBalance,
          referenceId: invoice.id,
          notes: `Invoice ${invoiceNo}`,
        },
      });

      return invoice;
    });
    await audit(auth, 'create', 'supplier_invoices', result.id, `Invoice ${invoiceNo} net ${netTotal.toFixed(2)}`);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
