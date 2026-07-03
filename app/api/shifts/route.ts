export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const shifts = await prisma.shift.findMany({ where: { organizationId: auth.organizationId }, orderBy: { startTime: 'asc' }, include: { _count: { select: { staff: true } } } });
    return NextResponse.json(shifts ?? []);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    if (!b?.name || !b?.startTime || !b?.endTime) return NextResponse.json({ error: 'Name, start and end time required' }, { status: 400 });
    const shift = await prisma.shift.create({
      data: { organizationId: auth.organizationId, name: b.name, startTime: b.startTime, endTime: b.endTime, graceMinutes: parseInt(b.graceMinutes) || 15 },
    });
    return NextResponse.json(shift);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
