export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

// Adjust (allowances/bonuses/advances), approve, or mark paid.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    requireManager(auth);
    const cur = await prisma.monthlyPayroll.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId } });
    if (!cur) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (cur.status === 'paid') return NextResponse.json({ error: 'Payroll already paid — locked' }, { status: 400 });

    const allowances = b?.allowances !== undefined ? parseFloat(b.allowances) || 0 : cur.allowances;
    const bonuses = b?.bonuses !== undefined ? parseFloat(b.bonuses) || 0 : cur.bonuses;
    const advances = b?.advances !== undefined ? parseFloat(b.advances) || 0 : cur.advances;
    const netSalary = Number((cur.baseSalary + allowances + bonuses + cur.overtimeAmount - cur.deductions - advances).toFixed(2));

    const data: any = { allowances, bonuses, advances, netSalary };
    if (b?.status === 'approved') data.status = 'approved';
    if (b?.status === 'paid') {
      data.status = 'paid';
      data.paidDate = new Date();
      data.paymentMethod = b?.paymentMethod ?? 'cash';
      // record salary as an expense so dashboards pick it up
      await prisma.expense.create({
        data: { organizationId: auth.organizationId, category: 'Salaries', amount: netSalary, date: new Date(), notes: `Payroll ${cur.month} — ${params?.id}` },
      });
    }
    if (b?.notes !== undefined) data.notes = b.notes;
    const rec = await prisma.monthlyPayroll.update({ where: { id: params?.id ?? '' }, data });
    if (b?.status === 'paid') await audit(auth, 'pay', 'monthly_payroll', rec.id, `Salary paid ${netSalary.toFixed(2)} for ${cur.month}`);
    return NextResponse.json(rec);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
