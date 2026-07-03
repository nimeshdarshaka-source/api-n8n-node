export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request) {
  try {
    const auth = await getAuth();
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const where: any = { organizationId: auth.organizationId };
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      where.date = { gte: start, lt: end };
    }
    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' }, take: 200 });
    const total = await prisma.expense.aggregate({ _sum: { amount: true }, where });
    return NextResponse.json({ expenses: expenses ?? [], total: total?._sum?.amount ?? 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { category, amount, date, notes } = body ?? {};
    if (!category || !amount) return NextResponse.json({ error: 'Category and amount required' }, { status: 400 });
    const expense = await prisma.expense.create({
      data: { organizationId: auth.organizationId, category, amount: parseFloat(amount) || 0, date: new Date(date || Date.now()), notes: notes ?? '' },
    });
    return NextResponse.json(expense);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
