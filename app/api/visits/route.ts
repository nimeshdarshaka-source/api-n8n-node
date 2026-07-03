export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request) {
  try {
    const auth = await getAuth();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const where: any = { organizationId: auth.organizationId };
    if (status) where.status = status;
    const visits = await prisma.visit.findMany({
      where, orderBy: { visitDate: 'desc' }, take: 100,
      include: { patient: true, doctor: true, services: { include: { service: true } } },
    });
    return NextResponse.json(visits ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { patientId, doctorId, visitDate, diagnosis, notes, services, paymentMethod } = body ?? {};
    if (!patientId || !doctorId) return NextResponse.json({ error: 'Patient and doctor required' }, { status: 400 });
    const [pOk, dOk] = await Promise.all([
      prisma.patient.findFirst({ where: { id: patientId, organizationId: auth.organizationId }, select: { id: true } }),
      prisma.doctor.findFirst({ where: { id: doctorId, organizationId: auth.organizationId }, select: { id: true } }),
    ]);
    if (!pOk || !dOk) return NextResponse.json({ error: 'Patient or doctor not found' }, { status: 404 });

    const servicesList = services ?? [];
    let totalAmount = 0;
    const serviceData: any[] = [];
    for (const s of servicesList) {
      const qty = parseInt(s?.quantity) || 1;
      const price = parseFloat(s?.unitPrice) || 0;
      const total = qty * price;
      totalAmount += total;
      serviceData.push({ serviceId: s?.serviceId, quantity: qty, unitPrice: price, total });
    }

    const visit = await prisma.visit.create({
      data: {
        organizationId: auth.organizationId,
        patientId, doctorId,
        visitDate: new Date(visitDate || Date.now()),
        diagnosis: diagnosis ?? '', notes: notes ?? '',
        totalAmount, paidAmount: totalAmount,
        paymentMethod: paymentMethod ?? 'cash',
        status: 'completed',
        services: { create: serviceData },
      },
      include: { patient: true, doctor: true, services: { include: { service: true } } },
    });
    return NextResponse.json(visit);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
