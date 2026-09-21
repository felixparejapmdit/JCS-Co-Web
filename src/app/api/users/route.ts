import { NextRequest, NextResponse } from 'next/server';
import { tenantStore, UserRecord } from '@/services/TenantDataStore';

export async function GET() {
  const safeUsers = tenantStore.users.map(({ password, ...rest }) => rest);
  return NextResponse.json({ success: true, users: safeUsers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'CREATE', user } = body;

    if (action === 'UNLOCK' && body.userId) {
      const target = tenantStore.users.find((u) => u.id === body.userId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      target.isLocked = false;
      target.status = 'ACTIVE';
      tenantStore.recordAudit('system', 'User', target.id, 'UNLOCK', 'admin', `Unlocked account for ${target.username}`);
      return NextResponse.json({ success: true, message: `Account for ${target.username} has been unlocked.` });
    }

    if (action === 'CREATE') {
      if (!user.username || !user.fullName || !user.role) {
        return NextResponse.json({ success: false, error: 'Username, Full Name, and Role are required.' }, { status: 400 });
      }

      const existing = tenantStore.users.find((u) => u.username.toLowerCase() === user.username.toLowerCase());
      if (existing) {
        return NextResponse.json({ success: false, error: `Username '${user.username}' already exists.` }, { status: 400 });
      }

      const newUser: UserRecord = {
        id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        username: user.username.trim(),
        password: user.password || 'Password123!',
        fullName: user.fullName.trim(),
        email: user.email || `${user.username.toLowerCase()}@jcs.ph`,
        role: user.role,
        assignedTenants: user.assignedTenants || ['8100', '8200', '8300'],
        isLocked: false,
        status: 'ACTIVE',
      };

      tenantStore.users.push(newUser);
      tenantStore.recordAudit('system', 'User', newUser.id, 'CREATE_USER', 'admin', `Created new user ${newUser.username} (${newUser.role})`);

      const { password, ...safeUser } = newUser;
      return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
    }

    if (action === 'UPDATE' && user.id) {
      const idx = tenantStore.users.findIndex((u) => u.id === user.id);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      tenantStore.users[idx] = {
        ...tenantStore.users[idx],
        fullName: user.fullName || tenantStore.users[idx].fullName,
        email: user.email || tenantStore.users[idx].email,
        role: user.role || tenantStore.users[idx].role,
        assignedTenants: user.assignedTenants || tenantStore.users[idx].assignedTenants,
        status: user.status || tenantStore.users[idx].status,
      };

      const { password, ...safeUser } = tenantStore.users[idx];
      return NextResponse.json({ success: true, user: safeUser });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
