'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { DocList } from '@/components/doc/DocList';
import { Spinner } from '@/components/ui/kit';

export default function DocListPage() {
  const { type } = useParams<{ type: string }>();
  return (
    <Suspense fallback={<Spinner />}>
      <DocList key={type} type={type} />
    </Suspense>
  );
}
