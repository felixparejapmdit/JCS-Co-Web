'use client';

import React, { useState } from 'react';
import { rpc } from '@/lib/api';
import { useSession } from '@/components/shell/AppShell';
import { Alert, Button, Card, Field, Input, KeyValue, PageHeader, useToast } from '@/components/ui/kit';

export default function AccountPage() {
  const toast = useToast();
  const { info } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (next !== again) return setError('The new passwords do not match.');
    setBusy(true);
    try {
      toast.success(await rpc<string>('auth.changePassword', { current, next }));
      setCurrent('');
      setNext('');
      setAgain('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="My account" description="Your sign-in details for this company." />
      <div className="space-y-6">
        <Card title="Profile">
          <KeyValue
            cols={2}
            items={[
              { label: 'Name', value: info.user.fullName },
              { label: 'Username', value: info.user.username },
              { label: 'User group', value: info.user.groupName },
              { label: 'Company', value: info.legal.bussname },
            ]}
          />
        </Card>
        <Card title="Change password" subtitle="At least 8 characters with letters and numbers. Passwords are stored as Argon2id hashes, never as readable text.">
          <div className="grid gap-4 sm:max-w-md">
            <Field label="Current password">
              <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <Field label="New password">
              <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <Field label="New password again">
              <Input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
            </Field>
            {error && <Alert tone="danger">{error}</Alert>}
            <div>
              <Button variant="primary" loading={busy} disabled={!current || !next} onClick={save}>
                Change password
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
