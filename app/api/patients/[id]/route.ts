export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const patient = await prisma.patient.findFirst({
      where: { id: params?.id ?? '', organizationId: auth.organizationId },
      include: { visits: { include: { doctor: true, services: { include: { service: true } } }, orderBy: { visitDate: 'desc' } } },
    });
    if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(patient);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const owned = await prisma.patient.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const patient = await prisma.patient.update({
      where: { id: params?.id ?? '' },
      data: {
        name: body?.name, phone: body?.phone,
        age: parseInt(body?.age) || 0, gender: body?.gender ?? 'Other',
        address: body?.address ?? '', notes: body?.notes ?? '',
      },
    });
    return NextResponse.json(patient);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
