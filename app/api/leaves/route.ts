export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const leaves = await prisma.leaveRequest.findMany({ where: { organizationId: auth.organizationId }, orderBy: { createdAt: 'desc' }, take: 100, include: { staff: { select: { name: true } } } });
    return NextResponse.json(leaves ?? []);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    if (!b?.staffId || !b?.fromDate || !b?.toDate) return NextResponse.json({ error: 'Staff, from and to dates required' }, { status: 400 });
    const stOk = await prisma.staff.findFirst({ where: { id: b.staffId, organizationId: auth.organizationId }, select: { id: true } });
    if (!stOk) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    const leave = await prisma.leaveRequest.create({
      data: {
        organizationId: auth.organizationId,
        staffId: b.staffId, fromDate: new Date(b.fromDate), toDate: new Date(b.toDate),
        leaveType: b.leaveType ?? 'casual', reason: b.reason ?? '',
      },
    });
    return NextResponse.json(leave);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
