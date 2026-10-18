import { SignIn, type DemoInfo } from '@/components/auth/SignIn';
import { isMysqlMode } from '@/server/db';
import { mysqlHoldsSampleData } from '@/server/db/source';

// Rendered on the server so the form, the expired notice and the sample accounts are all in the first paint.
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  let info: DemoInfo = { mode: 'mysql' };
  if (!isMysqlMode() || mysqlHoldsSampleData()) {
    // Sample data only (in memory, or loaded into local MySQL): shows the sample roles. No company is named.
    const { DEMO_ACCOUNTS, DEMO_PASSWORD } = await import('@/server/seed');
    info = isMysqlMode()
      ? { mode: 'mysql', accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD, sampleInMysql: true }
      : { mode: 'demo', accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD };
  }
  return <SignIn info={info} expired={Boolean(params.expired)} />;
}
