export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const ot = await prisma.overtimeRecord.findMany({ where: { organizationId: auth.organizationId }, orderBy: { date: 'desc' }, take: 100, include: { staff: { select: { name: true } } } });
    return NextResponse.json(ot ?? []);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    const hours = parseFloat(b?.hours) || 0;
    if (!b?.staffId || !b?.date || hours <= 0) return NextResponse.json({ error: 'Staff, date and hours required' }, { status: 400 });
    const staff = await prisma.staff.findFirst({ where: { id: b.staffId, organizationId: auth.organizationId } });
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    const rate = b?.rate !== undefined && b?.rate !== '' ? parseFloat(b.rate) || 0 : staff.otHourlyRate;
    const ot = await prisma.overtimeRecord.create({
      data: { organizationId: auth.organizationId, staffId: b.staffId, date: new Date(b.date), hours, rate, amount: hours * rate, approved: !!b?.approved, notes: b?.notes ?? '' },
    });
    return NextResponse.json(ot);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
