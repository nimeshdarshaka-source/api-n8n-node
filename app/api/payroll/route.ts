export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request) {
  try {
    const auth = await getAuth();
    const url = new URL(req.url);
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
    const payrolls = await prisma.monthlyPayroll.findMany({
      where: { month, organizationId: auth.organizationId },
      orderBy: { createdAt: 'asc' },
      include: { staff: { select: { name: true, role: true, salaryType: true } } },
    });
    return NextResponse.json(payrolls ?? []);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

// Payroll generation — per blueprint: read attendance, apply salary rules,
// apply OT and deductions, create records. One transaction. Body: { month: "2026-07" }
export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    requireManager(auth);
    const month = b?.month ?? new Date().toISOString().slice(0, 7);
    const [y, m] = month.split('-').map(Number);
    if (!y || !m) return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 });
    const mStart = new Date(y, m - 1, 1);
    const mEnd = new Date(y, m, 1);
    const workingDays = 26; // configurable assumption

    const result = await prisma.$transaction(async (tx) => {
      const staffList = await tx.staff.findMany({ where: { isActive: true, organizationId: auth.organizationId } });
      const created: any[] = [];
      for (const s of staffList) {
        const exists = await tx.monthlyPayroll.findUnique({ where: { staffId_month: { staffId: s.id, month } } });
        if (exists && exists.status !== 'draft') { created.push(exists); continue; }

        // 1. attendance summary
        const logs = await tx.attendanceLog.findMany({ where: { staffId: s.id, organizationId: auth.organizationId, date: { gte: mStart, lt: mEnd } } });
        const presentDays = logs.filter((l) => ['present', 'late', 'half'].includes(l.status)).length;
        const leaveDays = logs.filter((l) => l.status === 'leave').length;
        const absentDays = Math.max(0, workingDays - presentDays - leaveDays);

        // 2. salary rules
        let base = 0;
        if (s.salaryType === 'monthly') base = s.baseSalary;
        else if (s.salaryType === 'daily') base = s.dailyRate * presentDays;
        else if (s.salaryType === 'per_patient' && s.doctorId) {
          const visits = await tx.visit.count({ where: { doctorId: s.doctorId, organizationId: auth.organizationId, visitDate: { gte: mStart, lt: mEnd } } });
          base = s.perPatientRate * visits;
        } else if (s.salaryType === 'percentage' && s.doctorId) {
          const agg = await tx.visit.aggregate({ _sum: { paidAmount: true }, where: { doctorId: s.doctorId, organizationId: auth.organizationId, visitDate: { gte: mStart, lt: mEnd } } });
          base = ((agg?._sum?.paidAmount ?? 0) * s.percentageRate) / 100;
        }

        // 3. overtime (approved only)
        const otAgg = await tx.overtimeRecord.aggregate({ _sum: { amount: true }, where: { staffId: s.id, organizationId: auth.organizationId, approved: true, date: { gte: mStart, lt: mEnd } } });
        const overtimeAmount = otAgg?._sum?.amount ?? 0;

        // 4. attendance-linked deduction: absent days for monthly staff
        const deductions = s.salaryType === 'monthly' && s.baseSalary > 0 ? (s.baseSalary / workingDays) * absentDays : 0;

        const net = base + overtimeAmount - deductions;
        const data = {
          organizationId: auth.organizationId,
          staffId: s.id, month, baseSalary: Number(base.toFixed(2)),
          overtimeAmount: Number(overtimeAmount.toFixed(2)),
          deductions: Number(deductions.toFixed(2)),
          netSalary: Number(net.toFixed(2)),
          presentDays, absentDays, status: 'draft' as const,
        };
        const rec = exists
          ? await tx.monthlyPayroll.update({ where: { id: exists.id }, data })
          : await tx.monthlyPayroll.create({ data });
        created.push(rec);
      }
      return created;
    });
    await audit(auth, 'generate', 'monthly_payroll', month, `Payroll generated for ${result.length} staff`);
    return NextResponse.json(result);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
