export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    requireManager(auth);
    const b = await req.json();
    const owned = await prisma.leaveRequest.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const leave = await prisma.leaveRequest.update({
      where: { id: params?.id ?? '' },
      data: { status: b?.status ?? 'pending', approvedBy: b?.approvedBy ?? '' },
    });
    // mark approved leave days in attendance
    if (leave.status === 'approved') {
      for (let d = new Date(leave.fromDate); d <= leave.toDate; d = new Date(d.getTime() + 86400000)) {
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        await prisma.attendanceLog.upsert({
          where: { staffId_date: { staffId: leave.staffId, date: day } },
          create: { organizationId: auth.organizationId, staffId: leave.staffId, date: day, status: 'leave', notes: leave.leaveType },
          update: { status: 'leave', notes: leave.leaveType },
        });
      }
    }
    return NextResponse.json(leave);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
