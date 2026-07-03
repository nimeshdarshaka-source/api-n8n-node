export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    const services = await prisma.service.findMany({ where: { organizationId: auth.organizationId }, orderBy: { name: 'asc' } });
    return NextResponse.json(services ?? []);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const { name, category, price, description } = body ?? {};
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const service = await prisma.service.create({
      data: { organizationId: auth.organizationId, name, category: category ?? 'General', price: parseFloat(price) || 0, description: description ?? '' },
    });
    return NextResponse.json(service);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
