export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, audit, errStatus } from '@/lib/tenant';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth();
    const body = await req.json();
    const owned = await prisma.service.findFirst({ where: { id: params?.id ?? '', organizationId: auth.organizationId }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const service = await prisma.service.update({
      where: { id: params?.id ?? '' },
      data: {
        name: body?.name, category: body?.category ?? 'General',
        price: parseFloat(body?.price) || 0, description: body?.description ?? '',
        isActive: body?.isActive ?? true,
      },
    });
    return NextResponse.json(service);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) });
  }
}
