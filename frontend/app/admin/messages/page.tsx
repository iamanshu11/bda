'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

const statusBadge: Record<string, string> = {
  NEW: 'bg-rust-50 text-rust-700 dark:bg-rust-900/40 dark:text-rust-300',
  READ: 'bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
  RESPONDED: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  ARCHIVED: 'bg-surface-alt text-muted',
};

export default function AdminMessagesPage() {
  return (
    <ResourceManager
      title="Contact Messages"
      endpoint="/admin/contact-messages"
      canCreate={false}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'subject', label: 'Subject', render: (r) => (r.subject as string) ?? '—' },
        {
          key: 'status',
          label: 'Status',
          render: (r) => (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[r.status as string] ?? ''}`}>
              {String(r.status)}
            </span>
          ),
        },
      ]}
      fields={[
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'NEW', label: 'New' },
            { value: 'READ', label: 'Read' },
            { value: 'RESPONDED', label: 'Responded' },
            { value: 'ARCHIVED', label: 'Archived' },
          ],
        },
      ]}
    />
  );
}
