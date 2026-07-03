export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { TRIAL_DAYS } from '@/lib/billing';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, clinicName, phone } = body ?? {};
    if (!name || !email || !password || !clinicName) {
      return NextResponse.json({ error: 'Name, email, password and clinic name are required' }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: clinicName, ownerName: name, email, phone: phone ?? '', plan: 'trial', planExpiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000) },
      });
      const user = await tx.user.create({
        data: { name, email, password: hashed, role: 'owner', organizationId: org.id },
      });
      await tx.auditLog.create({
        data: { organizationId: org.id, userId: user.id, userName: name, action: 'create', tableName: 'organizations', recordId: org.id, detail: `Organization "${clinicName}" registered` },
      });
      return user;
    });
    return NextResponse.json({ id: result.id, name: result.name, email: result.email });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
