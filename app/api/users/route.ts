export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuth, requireOwner, audit, errStatus } from '@/lib/tenant';
import { PLANS } from '@/lib/billing';

export async function GET() {
  try {
    const auth = await getAuth();
    const users = await prisma.user.findMany({
      where: { organizationId: auth.organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users ?? []);
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}

// Owner creates logins for their team
export async function POST(req: Request) {
  try {
    const auth = await getAuth();
    requireOwner(auth);
    const b = await req.json();
    const { name, email, password, role } = b ?? {};
    if (!name || !email || !password) return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
    if (String(password).length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    const org = await prisma.organization.findUnique({ where: { id: auth.organizationId }, select: { plan: true } });
    const maxUsers = org && PLANS[org.plan] ? PLANS[org.plan].maxUsers : 999; // trial = unlimited
    const count = await prisma.user.count({ where: { organizationId: auth.organizationId } });
    if (count >= maxUsers) return NextResponse.json({ error: `Your ${org?.plan} plan allows ${maxUsers} logins. Upgrade on the Billing page.` }, { status: 402 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: ['manager', 'staff'].includes(role) ? role : 'staff', organizationId: auth.organizationId },
    });
    await audit(auth, 'create', 'users', user.id, `Login created for ${name} (${user.role})`);
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err: any) { return NextResponse.json({ error: err?.message ?? 'Error' }, { status: errStatus(err) }); }
}
