export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const staff = await prisma.staff.findMany({ where: { organizationId: auth.organizationId }, orderBy: { name: 'asc' }, include: { shift: true } });
    return NextResponse.json(staff ?? []);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    requireManager(auth);
    if (!b?.name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const staff = await prisma.staff.create({
      data: {
        organizationId: auth.organizationId,
        name: b.name, role: b.role ?? 'staff', phone: b.phone ?? '', email: b.email ?? '',
        pin: b.pin ?? '', doctorId: b.doctorId || null, shiftId: b.shiftId || null,
        salaryType: b.salaryType ?? 'monthly',
        baseSalary: parseFloat(b.baseSalary) || 0,
        dailyRate: parseFloat(b.dailyRate) || 0,
        perPatientRate: parseFloat(b.perPatientRate) || 0,
        percentageRate: parseFloat(b.percentageRate) || 0,
        otHourlyRate: parseFloat(b.otHourlyRate) || 0,
        joinedDate: b.joinedDate ? new Date(b.joinedDate) : new Date(),
      },
    });
    return NextResponse.json(staff);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
