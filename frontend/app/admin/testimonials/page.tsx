'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminTestimonialsPage() {
  return (
    <ResourceManager
      title="Testimonials"
      endpoint="/admin/testimonials"
      columns={[
        { key: 'authorName', label: 'Author' },
        { key: 'role', label: 'Role' },
        { key: 'rating', label: 'Rating' },
        { key: 'isApproved', label: 'Approved', render: (r) => (r.isApproved ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'authorName', label: 'Author name', required: true },
        { name: 'role', label: 'Role / batch', placeholder: 'e.g. NDA 2023' },
        { name: 'content', label: 'Testimonial', type: 'textarea', required: true },
        { name: 'rating', label: 'Rating (1-5)', type: 'number' },
        { name: 'photoUrl', label: 'Photo', type: 'image' },
        { name: 'isApproved', label: 'Approved (show on site)', type: 'checkbox' },
      ]}
    />
  );
}
