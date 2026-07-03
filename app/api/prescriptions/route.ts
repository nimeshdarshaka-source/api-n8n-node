export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const rx = await prisma.prescription.findMany({ where: { organizationId: auth.organizationId }, orderBy: { createdAt: 'desc' }, take: 100, include: { items: true } });
    // hydrate patient/doctor/brand names
    const patients = await prisma.patient.findMany({ where: { organizationId: auth.organizationId }, select: { id: true, name: true } });
    const doctors = await prisma.doctor.findMany({ where: { organizationId: auth.organizationId }, select: { id: true, name: true } });
    const brands = await prisma.brand.findMany({ where: { organizationId: auth.organizationId }, select: { id: true, name: true, strength: true } });
    const pm = new Map(patients.map((p) => [p.id, p.name]));
    const dm = new Map(doctors.map((d) => [d.id, d.name]));
    const bm = new Map(brands.map((b) => [b.id, `${b.name} ${b.strength}`.trim()]));
    const result = (rx ?? []).map((r) => ({
      ...r,
      patientName: pm.get(r.patientId) ?? '',
      doctorName: r.doctorId ? dm.get(r.doctorId) ?? '' : '',
      items: r.items.map((i) => ({ ...i, brandName: bm.get(i.brandId) ?? '' })),
    }));
    return NextResponse.json(result);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

// Body: { patientId, doctorId?, visitId?, notes?, items: [{ brandId, qty, dosage }] }
export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const b = await req.json();
    const items = (b?.items ?? []).filter((i: any) => i?.brandId && (parseInt(i.qty) || 0) > 0);
    if (!b?.patientId || items.length === 0) return NextResponse.json({ error: 'Patient and at least one item required' }, { status: 400 });
    const pOk = await prisma.patient.findFirst({ where: { id: b.patientId, organizationId: auth.organizationId }, select: { id: true } });
    if (!pOk) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    const rx = await prisma.prescription.create({
      data: {
        organizationId: auth.organizationId,
        patientId: b.patientId, doctorId: b.doctorId || null, visitId: b.visitId || null, notes: b.notes ?? '',
        items: { create: items.map((i: any) => ({ brandId: i.brandId, qty: parseInt(i.qty) || 0, dosage: i.dosage ?? '' })) },
      },
      include: { items: true },
    });
    return NextResponse.json(rx);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
