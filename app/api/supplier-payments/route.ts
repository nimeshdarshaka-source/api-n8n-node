export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const payments = await prisma.supplierPayment.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { paymentDate: 'desc' },
      include: {
        supplier: { select: { name: true } },
        allocations: { include: { invoice: { select: { invoiceNo: true } } } },
      },
    });
    return NextResponse.json(payments ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

// Supplier Payment — one database transaction per blueprint:
// 1. Create payment  2. Allocate to invoice(s) (oldest-first if not specified)
// 3. Update invoice paid/balance  4. Supplier ledger credit
export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { supplierId, paymentDate, method, amount, referenceNo, notes, allocations } = body ?? {};
    const amt = parseFloat(amount) || 0;
    requireManager(auth);
    const supOk = await prisma.supplier.findFirst({ where: { id: supplierId ?? '', organizationId: auth.organizationId }, select: { id: true } });
    if (supplierId && !supOk) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    if (!supplierId || !paymentDate || amt <= 0) {
      return NextResponse.json({ error: 'Supplier, date and a positive amount are required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Payment record
      const payment = await tx.supplierPayment.create({
        data: {
          organizationId: auth.organizationId,
          supplierId,
          paymentDate: new Date(paymentDate),
          method: method ?? 'cash',
          amount: amt,
          referenceNo: referenceNo ?? '',
          notes: notes ?? '',
        },
      });

      // 2. Determine allocations
      let allocList: { invoiceId: string; allocatedAmount: number }[] = [];
      if (Array.isArray(allocations) && allocations.length > 0) {
        allocList = allocations
          .map((a: any) => ({ invoiceId: a.invoiceId as string, allocatedAmount: parseFloat(a.allocatedAmount) || 0 }))
          .filter((a) => a.invoiceId && a.allocatedAmount > 0);
        const total = allocList.reduce((s, a) => s + a.allocatedAmount, 0);
        if (total - amt > 0.001) throw new Error('Allocated total exceeds payment amount');
      } else {
        // Auto-allocate oldest unpaid invoices first
        const openInvoices = await tx.supplierInvoice.findMany({
          where: { supplierId, organizationId: auth.organizationId, balanceAmount: { gt: 0 } },
          orderBy: { invoiceDate: 'asc' },
        });
        let remaining = amt;
        for (const inv of openInvoices) {
          if (remaining <= 0) break;
          const alloc = Math.min(remaining, inv.balanceAmount);
          allocList.push({ invoiceId: inv.id, allocatedAmount: alloc });
          remaining -= alloc;
        }
      }

      // 3. Apply allocations to invoices
      for (const a of allocList) {
        const inv = await tx.supplierInvoice.findFirst({ where: { id: a.invoiceId, organizationId: auth.organizationId } });
        if (!inv) throw new Error('Invoice not found');
        if (inv.supplierId !== supplierId) throw new Error('Invoice does not belong to this supplier');
        if (a.allocatedAmount - inv.balanceAmount > 0.001) throw new Error(`Allocation exceeds balance of invoice ${inv.invoiceNo}`);
        await tx.paymentAllocation.create({
          data: { paymentId: payment.id, invoiceId: a.invoiceId, allocatedAmount: a.allocatedAmount },
        });
        const newPaid = inv.paidAmount + a.allocatedAmount;
        const newBalance = inv.netTotal - newPaid;
        await tx.supplierInvoice.update({
          where: { id: a.invoiceId },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newBalance <= 0.001 ? 'paid' : 'partial',
          },
        });
      }

      // 4. Supplier ledger credit
      const last = await tx.supplierLedger.findFirst({ where: { supplierId }, orderBy: { createdAt: 'desc' } });
      const runningBalance = (last?.runningBalance ?? 0) - amt;
      await tx.supplierLedger.create({
        data: {
          organizationId: auth.organizationId,
          supplierId,
          date: new Date(paymentDate),
          transactionType: 'payment',
          debit: 0,
          credit: amt,
          runningBalance,
          referenceId: payment.id,
          notes: `Payment ${referenceNo ?? ''}`.trim(),
        },
      });

      return { payment, allocations: allocList };
    });
    await audit(auth, 'pay', 'supplier_payments', result.payment.id, `Paid ${amt.toFixed(2)} to supplier`);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
