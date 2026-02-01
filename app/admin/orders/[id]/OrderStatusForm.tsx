'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const allowedStatuses = ['pending', 'paid', 'shipped', 'cancelled'] as const;
type AllowedStatus = (typeof allowedStatuses)[number];

export default function OrderStatusForm({ id, initialStatus }: { id: string; initialStatus?: string }) {
  const router = useRouter();
  const initial: AllowedStatus = allowedStatuses.includes(initialStatus as any)
    ? (initialStatus as AllowedStatus)
    : 'pending';

  const [status, setStatus] = useState<AllowedStatus>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const next: AllowedStatus = allowedStatuses.includes(initialStatus as any)
      ? (initialStatus as AllowedStatus)
      : 'pending';
    setStatus(next);
  }, [initialStatus]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed (${res.status})` });
        return;
      }

      setMessage({ type: 'success', text: 'Status updated.' });
      router.refresh();
    } catch (err) {
      console.error('Failed to update order:', err);
      setMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <select value={status} onChange={(e) => setStatus(e.target.value as AllowedStatus)} disabled={submitting}>
        {allowedStatuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button type="submit" disabled={submitting} style={{ padding: '0.25rem 0.5rem' }}>
        {submitting ? 'Updating...' : 'Update'}
      </button>
      {message ? (
        <span style={{ color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>{message.text}</span>
      ) : null}
    </form>
  );
}

