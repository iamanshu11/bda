'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminReviewsPage() {
  return (
    <ResourceManager
      title="Reviews"
      endpoint="/admin/reviews"
      canCreate={false}
      columns={[
        { key: 'user', label: 'Author', render: (r) => (r.user as { name?: string })?.name ?? '—' },
        { key: 'course', label: 'Course', render: (r) => (r.course as { title?: string })?.title ?? '—' },
        { key: 'rating', label: 'Rating', render: (r) => `${r.rating} / 5` },
        { key: 'title', label: 'Title', render: (r) => (r.title as string) ?? '—' },
        { key: 'isApproved', label: 'Approved', render: (r) => (r.isApproved ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'isApproved', label: 'Approved (visible publicly)', type: 'checkbox' },
      ]}
    />
  );
}
