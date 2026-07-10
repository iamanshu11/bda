'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminUsersPage() {
  return (
    <ResourceManager
      title="Users"
      endpoint="/admin/users"
      canCreate={false}
      canDelete={false}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role', render: (r) => (r.role as { name?: string })?.name ?? '—' },
        { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'phone', label: 'Phone' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  );
}
