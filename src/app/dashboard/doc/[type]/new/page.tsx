'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { DocEditor } from '@/components/doc/DocEditor';
import { Spinner } from '@/components/ui/kit';

function Editor() {
  const { type } = useParams<{ type: string }>();
  const params = useSearchParams();
  return <DocEditor key={`${type}-${params.get('from') ?? ''}-${params.get('no') ?? ''}`} type={type} />;
}

export default function NewDocPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Editor />
    </Suspense>
  );
}
