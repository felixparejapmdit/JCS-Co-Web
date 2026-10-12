'use client';

import { useParams } from 'next/navigation';
import { ReportHub } from '@/components/reports/ReportLibrary';

export default function ModuleReportsPage() {
  const { module } = useParams<{ module: string }>();
  return <ReportHub key={module} module={module} />;
}
