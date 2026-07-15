'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

const actionColor: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  UPDATE: 'bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
  DELETE: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  FORCE_SUBMIT: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  ROLE_CHANGE: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
};

export default function AdminAuditLogsPage() {
  return (
    <ResourceManager
      title="Audit Log"
      endpoint="/admin/audit-logs"
      columns={[
        {
          key: 'action',
          label: 'Action',
          render: (r) => (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                actionColor[r.action as string] ?? 'bg-surface-alt text-muted'
              }`}
            >
              {String(r.action)}
            </span>
          ),
        },
        { key: 'targetType', label: 'Target', render: (r) => String(r.targetType ?? '—') },
        { key: 'summary', label: 'Summary', render: (r) => String(r.summary ?? '—') },
        {
          key: 'actorEmail',
          label: 'Actor',
          render: (r) => String(r.actorEmail ?? r.actorId ?? 'system'),
        },
        { key: 'ip', label: 'IP', render: (r) => String(r.ip ?? '—') },
        {
          key: 'createdAt',
          label: 'When',
          render: (r) => new Date(r.createdAt as string).toLocaleString('en-IN'),
        },
      ]}
    />
  );
}
