export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, requireManager, errStatus } from '@/lib/tenant';

export async function GET() {
  try {
    const auth = await getAuth();
    requireManager(auth);
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: auth.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(logs ?? []);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
