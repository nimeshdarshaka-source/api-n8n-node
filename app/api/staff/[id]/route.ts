export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    requireManager(auth);
    const b = await req.json();
    const owned = await prisma.staff.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data: any = {};
    for (const k of ['name','role','phone','email','pin','salaryType','paymentMethod','notes']) if (b?.[k] !== undefined) data[k] = b[k];
    for (const k of ['baseSalary','dailyRate','perPatientRate','percentageRate','otHourlyRate']) if (b?.[k] !== undefined) data[k] = parseFloat(b[k]) || 0;
    if (b?.shiftId !== undefined) data.shiftId = b.shiftId || null;
    if (b?.doctorId !== undefined) data.doctorId = b.doctorId || null;
    if (b?.isActive !== undefined) data.isActive = !!b.isActive;
    const staff = await prisma.staff.update({ where: { id: params?.id ?? '' }, data });
    return NextResponse.json(staff);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
