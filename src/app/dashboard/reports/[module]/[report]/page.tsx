'use client';

import { useParams } from 'next/navigation';
import { ReportViewer } from '@/components/reports/ReportLibrary';

export default function ReportPage() {
  const { module, report } = useParams<{ module: string; report: string }>();
  return <ReportViewer key={`${module}/${report}`} id={`${module}/${report}`} />;
}
