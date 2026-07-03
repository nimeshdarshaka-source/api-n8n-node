export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET(req: Request) {
  try {
    const auth = await getAuth();
    const url = new URL(req.url);
    const search = url.searchParams.get('search') ?? '';
    const where: any = { organizationId: auth.organizationId };
    if (search) where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
    const patients = await prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json(patients ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { name, phone, age, gender, address, notes } = body ?? {};
    if (!name || !phone) return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });
    const patient = await prisma.patient.create({
      data: { organizationId: auth.organizationId, name, phone, age: parseInt(age) || 0, gender: gender ?? 'Other', address: address ?? '', notes: notes ?? '' },
    });
    return NextResponse.json(patient);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
