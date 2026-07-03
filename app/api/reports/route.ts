export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

// Multi-period report. Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (to is inclusive)
export async function GET(req: Request) {
  try {
    const auth = await getAuth();
    const url = new URL(req.url);
    const now = new Date();
    const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toRaw = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : now;
    const to = new Date(toRaw.getFullYear(), toRaw.getMonth(), toRaw.getDate() + 1); // exclusive

    const [visits, dispensed, expenses, supplierPayments, payrolls, ledgerIn] = await Promise.all([
      prisma.visit.findMany({ where: { organizationId: auth.organizationId, visitDate: { gte: from, lt: to } }, include: { doctor: { select: { name: true } }, services: { include: { service: { select: { name: true } } } } } }),
      prisma.dispensedItem.findMany({ where: { organizationId: auth.organizationId, createdAt: { gte: from, lt: to } }, include: { brand: { select: { name: true, strength: true } } } }),
      prisma.expense.findMany({ where: { organizationId: auth.organizationId, date: { gte: from, lt: to } } }),
      prisma.supplierPayment.findMany({ where: { organizationId: auth.organizationId, paymentDate: { gte: from, lt: to } }, include: { supplier: { select: { name: true } } } }),
      prisma.monthlyPayroll.findMany({ where: { organizationId: auth.organizationId, status: 'paid', paidDate: { gte: from, lt: to } } }),
      prisma.stockLedger.aggregate({ _sum: { qty: true }, where: { organizationId: auth.organizationId, movementType: 'IN', createdAt: { gte: from, lt: to } } }),
    ]);

    // financial
    const consultIncome = (visits ?? []).reduce((s, v) => s + (v.paidAmount ?? 0), 0);
    const drugSales = (dispensed ?? []).reduce((s, d) => s + d.totalSale, 0);
    const drugCost = (dispensed ?? []).reduce((s, d) => s + d.totalCost, 0);
    const drugProfit = (dispensed ?? []).reduce((s, d) => s + d.profit, 0);
    const totalExpenses = (expenses ?? []).reduce((s, e) => s + e.amount, 0);
    const salariesPaid = (payrolls ?? []).reduce((s, p) => s + p.netSalary, 0);
    const supplierPaid = (supplierPayments ?? []).reduce((s, p) => s + p.amount, 0);
    const totalIncome = consultIncome + drugSales;
    const netProfit = totalIncome - drugCost - totalExpenses;

    // patients
    const patientCount = visits.length;
    const uniquePatients = new Set(visits.map((v) => v.patientId)).size;

    // doctor-wise
    const byDoctor: Record<string, { visits: number; revenue: number }> = {};
    for (const v of visits) {
      const k = v.doctor?.name ?? 'Unknown';
      byDoctor[k] = byDoctor[k] ?? { visits: 0, revenue: 0 };
      byDoctor[k].visits += 1;
      byDoctor[k].revenue += v.paidAmount ?? 0;
    }

    // service-wise
    const byService: Record<string, { qty: number; revenue: number }> = {};
    for (const v of visits) for (const sv of v.services ?? []) {
      const k = sv.service?.name ?? 'Other';
      byService[k] = byService[k] ?? { qty: 0, revenue: 0 };
      byService[k].qty += sv.quantity;
      byService[k].revenue += sv.total;
    }

    // item-wise drug profit
    const byBrand: Record<string, { qty: number; sales: number; cost: number; profit: number }> = {};
    for (const d of dispensed) {
      const k = `${d.brand?.name ?? ''} ${d.brand?.strength ?? ''}`.trim() || 'Unknown';
      byBrand[k] = byBrand[k] ?? { qty: 0, sales: 0, cost: 0, profit: 0 };
      byBrand[k].qty += d.qty; byBrand[k].sales += d.totalSale; byBrand[k].cost += d.totalCost; byBrand[k].profit += d.profit;
    }

    // expense categories
    const byExpense: Record<string, number> = {};
    for (const e of expenses) byExpense[e.category] = (byExpense[e.category] ?? 0) + e.amount;

    // payment methods
    const byMethod: Record<string, number> = {};
    for (const v of visits) byMethod[v.paymentMethod || 'cash'] = (byMethod[v.paymentMethod || 'cash'] ?? 0) + (v.paidAmount ?? 0);

    return NextResponse.json({
      from: from.toISOString(), to: toRaw.toISOString(),
      financial: {
        totalIncome, consultIncome, drugSales, drugCost, drugProfit,
        totalExpenses, salariesPaid, supplierPaid, netProfit,
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
      },
      patients: { visitCount: patientCount, uniquePatients, avgIncomePerVisit: patientCount > 0 ? totalIncome / patientCount : 0 },
      stockUnitsReceived: ledgerIn?._sum?.qty ?? 0,
      byDoctor: Object.entries(byDoctor).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue),
      byService: Object.entries(byService).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue),
      byBrand: Object.entries(byBrand).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.profit - a.profit),
      byExpense: Object.entries(byExpense).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount),
      byMethod: Object.entries(byMethod).map(([name, amount]) => ({ name, amount })),
    });
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
