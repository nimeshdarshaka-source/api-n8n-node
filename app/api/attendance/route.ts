export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

const dayStart = (d?: string) => {
  const x = d ? new Date(d) : new Date();
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

export async function GET(req: Request) {
  try {
    const auth = await getAuth();
    const url = new URL(req.url);
    const date = dayStart(url.searchParams.get('date') ?? undefined);
    const end = new Date(date.getTime() + 86400000);
    const [logs, staff] = await Promise.all([
      prisma.attendanceLog.findMany({ where: { organizationId: auth.organizationId, date: { gte: date, lt: end } }, include: { staff: { select: { name: true, role: true } } } }),
      prisma.staff.findMany({ where: { organizationId: auth.organizationId, isActive: true }, orderBy: { name: 'asc' }, include: { shift: true } }),
    ]);
    return NextResponse.json({ date: date.toISOString(), logs: logs ?? [], staff: staff ?? [] });
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

// Check-in / check-out. Body: { staffId, action: 'in'|'out', pin?, method?, notes? }
export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    const { staffId, action, pin, method, notes } = b ?? {};
    if (!staffId || !['in', 'out'].includes(action)) return NextResponse.json({ error: 'staffId and action (in/out) required' }, { status: 400 });
    const staff = await prisma.staff.findFirst({ where: { id: staffId, organizationId: auth.organizationId }, include: { shift: true } });
    if (!staff) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    if (method === 'pin') {
      if (!staff.pin || staff.pin !== String(pin ?? '')) return NextResponse.json({ error: 'Invalid PIN' }, { status: 403 });
    }
    const now = new Date();
    const date = dayStart();

    if (action === 'in') {
      // late if after shift start + grace
      let status = 'present';
      if (staff.shift) {
        const [h, m] = staff.shift.startTime.split(':').map(Number);
        const cutoff = new Date(date);
        cutoff.setHours(h, m + (staff.shift.graceMinutes ?? 0), 0, 0);
        if (now > cutoff) status = 'late';
      }
      const log = await prisma.attendanceLog.upsert({
        where: { staffId_date: { staffId, date } },
        create: { organizationId: auth.organizationId, staffId, date, checkIn: now, method: method ?? 'manual', status, notes: notes ?? '' },
        update: { checkIn: now, method: method ?? 'manual', status },
      });
      return NextResponse.json(log);
    } else {
      const log = await prisma.attendanceLog.upsert({
        where: { staffId_date: { staffId, date } },
        create: { organizationId: auth.organizationId, staffId, date, checkOut: now, method: method ?? 'manual', notes: notes ?? '' },
        update: { checkOut: now },
      });
      return NextResponse.json(log);
    }
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
