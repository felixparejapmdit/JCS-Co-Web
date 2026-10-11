'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DocEditor } from '@/components/doc/DocEditor';
import { Spinner } from '@/components/ui/kit';

export default function EditDocPage() {
  const { type, no } = useParams<{ type: string; no: string }>();
  const docNo = decodeURIComponent(no);
  return (
    <Suspense fallback={<Spinner />}>
      <DocEditor key={`${type}-${docNo}`} type={type} no={docNo} />
    </Suspense>
  );
}
