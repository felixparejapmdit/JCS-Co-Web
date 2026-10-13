import { SignIn, type DemoInfo } from '@/components/auth/SignIn';
import { isMysqlMode } from '@/server/db';

// Rendered on the server so the form, the expired notice and the sample accounts are all in the first paint.
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let info: DemoInfo = { mode: 'mysql' };
  if (!isMysqlMode()) {
    // Public sample-data preview only: shows the sample roles. No company is named.
    const { DEMO_ACCOUNTS, DEMO_PASSWORD } = await import('@/server/seed');
    info = { mode: 'demo', accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD };
  }
  return <SignIn info={info} expired={Boolean(params.expired)} />;
}
