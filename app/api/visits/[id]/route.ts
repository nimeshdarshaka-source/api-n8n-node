export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const visit = await prisma.visit.findFirst({
      where: { id: params?.id ?? '', organizationId: auth.organizationId },
      include: { patient: true, doctor: true, services: { include: { service: true } } },
    });
    if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(visit);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const owned = await prisma.visit.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const visit = await prisma.visit.update({
      where: { id: params?.id ?? '' },
      data: {
        status: body?.status,
        paidAmount: body?.paidAmount != null ? parseFloat(body.paidAmount) : undefined,
        paymentMethod: body?.paymentMethod,
        diagnosis: body?.diagnosis,
        notes: body?.notes,
      },
    });
    return NextResponse.json(visit);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
