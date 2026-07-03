export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const doctors = await prisma.doctor.findMany({ where: { organizationId: auth.organizationId }, orderBy: { name: 'asc' } });
    return NextResponse.json(doctors ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { name, specialization, phone, consultRate } = body ?? {};
    if (!name || !specialization) return NextResponse.json({ error: 'Name and specialization required' }, { status: 400 });
    const doctor = await prisma.doctor.create({
      data: { organizationId: auth.organizationId, name, specialization, phone: phone ?? '', consultRate: parseFloat(consultRate) || 0 },
    });
    return NextResponse.json(doctor);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
