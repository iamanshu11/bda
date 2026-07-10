'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminBlogsPage() {
  return (
    <ResourceManager
      title="Blogs"
      endpoint="/admin/blogs"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'isPublished', label: 'Published', render: (r) => (r.isPublished ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'excerpt', label: 'Excerpt' },
        { name: 'content', label: 'Content', type: 'textarea', required: true },
        { name: 'coverUrl', label: 'Cover image', type: 'image' },
        { name: 'isPublished', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}
