'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminStudyMaterialsPage() {
  return (
    <ResourceManager
      title="Study Materials"
      endpoint="/admin/study-materials"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'isPublished', label: 'Published', render: (r) => (r.isPublished ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'category', label: 'Category', placeholder: 'e.g. Notes, NCERT' },
        { name: 'fileUrl', label: 'File URL (PDF)', placeholder: 'https://…' },
        { name: 'isPublished', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}
