import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { tenantStore } from '@/services/TenantDataStore';

const JWT_SECRET = process.env.JWT_SECRET || 'SuperSecretKeyForAOS100NextGenJwtAuth2026!';

const strikeTracker: Record<string, number> = {};
const lockedAccounts: Set<string> = new Set();

const TENANT_NAMES: Record<string, string> = {
  '8100': 'JCS Chemical Industries, Inc.',
  '8200': 'APF Corporation',
  '8300': 'Chemag Trading Corporation',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, tenantId } = body;

    if (!username || !password || !tenantId) {
      return NextResponse.json(
        { error: 'Username, password, and corporate entity are required.' },
        { status: 400 }
      );
    }

    const normalizedUser = username.trim().toLowerCase();
    const tenantKey = `${normalizedUser}:${tenantId}`;

    // Check account lock state from store or local tracker
    const existingUser = tenantStore.users.find((u) => u.username.toLowerCase() === normalizedUser);
    if (existingUser?.isLocked || lockedAccounts.has(tenantKey)) {
      return NextResponse.json(
        {
          error: 'Account locked due to consecutive failed login attempts. Contact IT Administrator.',
          isLocked: true,
        },
        { status: 403 }
      );
    }

    // Match user from live tenantStore.users
    const user = tenantStore.users.find(
      (u) => u.username.toLowerCase() === normalizedUser && u.password === password
    );

    if (!user) {
      const currentStrikes = (strikeTracker[tenantKey] || 0) + 1;
      strikeTracker[tenantKey] = currentStrikes;

      if (currentStrikes >= 5) {
        lockedAccounts.add(tenantKey);
        if (existingUser) {
          existingUser.isLocked = true;
        }
        return NextResponse.json(
          {
            error: 'Account locked: 5 failed attempts exceeded. Security alert logged.',
            isLocked: true,
            strikesRemaining: 0,
          },
          { status: 403 }
        );
      }

      const remaining = 5 - currentStrikes;
      return NextResponse.json(
        {
          error: `Invalid credentials. ${remaining} strike${remaining === 1 ? '' : 's'} remaining before account lockout.`,
          strikesRemaining: remaining,
          isLocked: false,
        },
        { status: 401 }
      );
    }

    // Check tenant access if assigned
    if (user.assignedTenants && user.assignedTenants.length > 0 && !user.assignedTenants.includes(tenantId)) {
      return NextResponse.json(
        {
          error: `User '${user.username}' is not authorized to access company ${tenantId} (${TENANT_NAMES[tenantId] || tenantId}).`,
          isLocked: false,
        },
        { status: 403 }
      );
    }

    // Clear strikes
    delete strikeTracker[tenantKey];
    user.lastLogin = new Date().toISOString();

    const tenantName = TENANT_NAMES[tenantId] || 'Corporate Entity';

    // Issue JWT Bearer token
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        tenantId,
        tenantName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 hour session
      },
      JWT_SECRET
    );

    // Record audit
    tenantStore.recordAudit(
      tenantId,
      'Auth',
      user.id,
      'LOGIN',
      user.username,
      `User ${user.fullName} logged into ${tenantName} (${tenantId})`
    );

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          tenantId,
          tenantName,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set('aos100_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Authentication service error.' },
      { status: 500 }
    );
  }
}
