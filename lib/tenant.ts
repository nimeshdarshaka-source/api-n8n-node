import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { planState } from '@/lib/billing';

export type Auth = { userId: string; organizationId: string; role: string; name: string };

// Roles: owner > manager > staff. Financial/destructive actions need manager+.
const MANAGER_ROLES = ['owner', 'manager'];

export async function getAuth(opts?: { allowExpired?: boolean }): Promise<Auth> {
  const session: any = await getServerSession(authOptions);
  const u = session?.user;
  if (!u?.id || !u?.organizationId) {
    const err: any = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }
  const auth: Auth = { userId: u.id, organizationId: u.organizationId, role: u.role ?? 'staff', name: u.name ?? '' };
  if (!opts?.allowExpired) {
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { plan: true, status: true, planExpiresAt: true },
    });
    if (!org) { const e: any = new Error('Organization not found'); e.status = 401; throw e; }
    const state = planState(org);
    if (state.blocked) {
      const e: any = new Error('Subscription expired — please renew on the Billing page');
      e.status = 402;
      throw e;
    }
  }
  return auth;
}

export function requireManager(auth: Auth) {
  if (!MANAGER_ROLES.includes(auth.role)) {
    const err: any = new Error('Requires manager or owner role');
    err.status = 403;
    throw err;
  }
}

export function requireOwner(auth: Auth) {
  if (auth.role !== 'owner') {
    const err: any = new Error('Requires owner role');
    err.status = 403;
    throw err;
  }
}

// Write an audit log entry. tx may be a Prisma transaction client or undefined.
export async function audit(auth: Auth, action: string, tableName: string, recordId: string, detail = '', tx?: any) {
  const client = tx ?? prisma;
  try {
    await client.auditLog.create({
      data: {
        organizationId: auth.organizationId,
        userId: auth.userId,
        userName: auth.name,
        action, tableName, recordId, detail,
      },
    });
  } catch { /* audit must never break the main flow */ }
}

export function errStatus(err: any): number {
  return typeof err?.status === 'number' ? err.status : 500;
}
