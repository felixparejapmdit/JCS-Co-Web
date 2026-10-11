'use client';

import { useParams } from 'next/navigation';
import { DocView } from '@/components/doc/DocView';

export default function DocViewPage() {
  const { type, no } = useParams<{ type: string; no: string }>();
  const docNo = decodeURIComponent(no);
  return <DocView key={`${type}-${docNo}`} type={type} no={docNo} />;
}
