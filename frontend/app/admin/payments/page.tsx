'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

const statusColor: Record<string, string> = {
  PAID: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  CREATED: 'bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  REFUNDED: 'bg-surface-alt text-muted',
};

export default function AdminPaymentsPage() {
  return (
    <ResourceManager
      title="Payments"
      endpoint="/admin/payments"
      columns={[
        { key: 'user', label: 'Student', render: (r) => (r.user as { name?: string })?.name ?? '—' },
        { key: 'course', label: 'Course', render: (r) => (r.course as { title?: string })?.title ?? '—' },
        { key: 'amount', label: 'Amount', render: (r) => `₹${(Number(r.amount) / 100).toLocaleString('en-IN')}` },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[r.status as string] ?? ''}`}>
              {String(r.status)}
            </span>
          ),
        },
        { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt as string).toLocaleDateString('en-IN') },
      ]}
    />
  );
}
