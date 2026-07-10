'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminCategoriesPage() {
  return (
    <ResourceManager
      title="Categories"
      endpoint="/admin/categories"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'order', label: 'Order' },
        { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'iconKey', label: 'Icon key', placeholder: 'e.g. medal' },
        { name: 'order', label: 'Order', type: 'number' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  );
}
