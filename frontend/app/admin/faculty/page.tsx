'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminFacultyPage() {
  return (
    <ResourceManager
      title="Faculty"
      endpoint="/admin/faculty"
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'designation', label: 'Designation' },
        { name: 'bio', label: 'Bio', type: 'textarea' },
        { name: 'photoUrl', label: 'Photo', type: 'image' },
        { name: 'order', label: 'Order', type: 'number' },
        { name: 'isActive', label: 'Active', type: 'checkbox' },
      ]}
    />
  );
}
