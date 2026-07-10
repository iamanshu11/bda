'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminResultsPage() {
  return (
    <ResourceManager
      title="Results"
      endpoint="/admin/results"
      columns={[
        { key: 'studentName', label: 'Student' },
        { key: 'rank', label: 'Rank' },
        { key: 'exam', label: 'Exam' },
        { key: 'year', label: 'Year' },
      ]}
      fields={[
        { name: 'studentName', label: 'Student name', required: true },
        { name: 'rank', label: 'Rank', placeholder: 'e.g. AIR 42', required: true },
        { name: 'exam', label: 'Exam', placeholder: 'e.g. NDA 2023', required: true },
        { name: 'year', label: 'Year', type: 'number' },
        { name: 'photoUrl', label: 'Photo', type: 'image' },
        { name: 'order', label: 'Order', type: 'number' },
      ]}
    />
  );
}
