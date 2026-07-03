export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const soon = new Date(todayStart.getTime() + 90 * 86400000);

    const [todayVisits, totalPatients, todayExpensesAgg, monthVisits, monthExpensesAgg, recentVisits, monthDrugAgg, openInvoices, activeBatches] = await Promise.all([
      prisma.visit.findMany({ where: { organizationId: auth.organizationId, visitDate: { gte: todayStart, lt: todayEnd } } }),
      prisma.patient.count({ where: { organizationId: auth.organizationId } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { organizationId: auth.organizationId, date: { gte: todayStart, lt: todayEnd } } }),
      prisma.visit.findMany({ where: { organizationId: auth.organizationId, visitDate: { gte: monthStart, lt: monthEnd } } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { organizationId: auth.organizationId, date: { gte: monthStart, lt: monthEnd } } }),
      prisma.visit.findMany({ where: { organizationId: auth.organizationId }, take: 5, orderBy: { visitDate: 'desc' }, include: { patient: true, doctor: true } }),
      prisma.dispensedItem.aggregate({ _sum: { totalCost: true, totalSale: true, profit: true }, where: { organizationId: auth.organizationId, createdAt: { gte: monthStart, lt: monthEnd } } }),
      prisma.supplierInvoice.aggregate({ _sum: { balanceAmount: true }, where: { organizationId: auth.organizationId, balanceAmount: { gt: 0 } } }),
      prisma.batch.findMany({ where: { organizationId: auth.organizationId, remainingQty: { gt: 0 } }, select: { remainingQty: true, realUnitCost: true, expiryDate: true } }),
    ]);

    const allItems = await prisma.inventoryItem.findMany({ where: { organizationId: auth.organizationId, isActive: true } });
    const lowStockCount = (allItems ?? []).filter((i: any) => (i?.currentStock ?? 0) < (i?.minStock ?? 0)).length;

    const stockValue = (activeBatches ?? []).reduce((s, b) => s + b.remainingQty * b.realUnitCost, 0);
    const expiredCount = (activeBatches ?? []).filter((b) => b.expiryDate < todayStart).length;
    const expiringSoonCount = (activeBatches ?? []).filter((b) => b.expiryDate >= todayStart && b.expiryDate <= soon).length;

    const todayIncome = (todayVisits ?? []).reduce((sum: number, v: any) => sum + (v?.paidAmount ?? 0), 0);
    const todayExpenses = todayExpensesAgg?._sum?.amount ?? 0;
    const monthRevenue = (monthVisits ?? []).reduce((sum: number, v: any) => sum + (v?.paidAmount ?? 0), 0);
    const monthDrugSales = monthDrugAgg?._sum?.totalSale ?? 0;
    const monthExpenses = monthExpensesAgg?._sum?.amount ?? 0;
    const monthDrugCost = monthDrugAgg?._sum?.totalCost ?? 0;
    const monthProfit = monthRevenue + monthDrugSales - monthDrugCost - monthExpenses;
    const supplierOutstanding = openInvoices?._sum?.balanceAmount ?? 0;

    const monthlyChart: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mName = mStart.toLocaleString('en', { month: 'short' });
      const mVisits = await prisma.visit.findMany({ where: { organizationId: auth.organizationId, visitDate: { gte: mStart, lt: mEnd } } });
      const mExp = await prisma.expense.aggregate({ _sum: { amount: true }, where: { organizationId: auth.organizationId, date: { gte: mStart, lt: mEnd } } });
      const mDrug = await prisma.dispensedItem.aggregate({ _sum: { totalCost: true, totalSale: true }, where: { organizationId: auth.organizationId, createdAt: { gte: mStart, lt: mEnd } } });
      monthlyChart.push({
        month: mName,
        revenue: Number(((mVisits ?? []).reduce((s: number, v: any) => s + (v?.paidAmount ?? 0), 0) + (mDrug?._sum?.totalSale ?? 0)).toFixed(2)),
        expenses: Number(((mExp?._sum?.amount ?? 0) + (mDrug?._sum?.totalCost ?? 0)).toFixed(2)),
      });
    }

    return NextResponse.json({
      todayPatients: (todayVisits ?? []).length,
      todayIncome, todayExpenses, monthRevenue, monthExpenses,
      monthDrugCost, monthDrugSales, monthProfit, totalPatients,
      lowStockCount, expiringSoonCount, expiredCount, stockValue,
      supplierOutstanding,
      recentVisits: recentVisits ?? [],
      monthlyChart,
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: errStatus(err) });
  }
}
