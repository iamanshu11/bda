'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminAnnouncementsPage() {
  return (
    <ResourceManager
      title="Command Announcements"
      endpoint="/admin/announcements"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'pinned', label: 'Pinned', render: (r) => (r.pinned ? 'Yes' : 'No') },
        { key: 'isPublished', label: 'Published', render: (r) => (r.isPublished ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'body', label: 'Message', type: 'textarea', required: true },
        { name: 'pinned', label: 'Pin to top', type: 'checkbox' },
        { name: 'isPublished', label: 'Published (visible to cadets)', type: 'checkbox' },
      ]}
    />
  );
}
