'use client';

import Link from 'next/link';
import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminCoursesPage() {
  return (
    <ResourceManager
      title="Courses"
      endpoint="/admin/courses"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category', render: (r) => (r.category as { name?: string })?.name ?? '—' },
        { key: 'isPublished', label: 'Published', render: (r) => (r.isPublished ? 'Yes' : 'No') },
        {
          key: 'modules',
          label: 'Content',
          render: (r) => (
            <Link
              href={`/admin/courses/${r.id}/modules`}
              className="font-semibold text-navy-600 hover:underline dark:text-navy-200"
            >
              Manage modules
            </Link>
          ),
        },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'shortDesc', label: 'Short description' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'badge', label: 'Badge text', placeholder: 'e.g. Guarantee Batch' },
        {
          name: 'badgeType',
          label: 'Badge type',
          type: 'select',
          options: [
            { value: 'FOUNDATION', label: 'Foundation' },
            { value: 'GUARANTEE', label: 'Guarantee' },
          ],
        },
        { name: 'durationWeeks', label: 'Duration (weeks)', type: 'number' },
        { name: 'fees', label: 'Fees (₹)', type: 'number' },
        { name: 'bannerUrl', label: 'Banner image', type: 'image' },
        { name: 'isPublished', label: 'Published', type: 'checkbox' },
      ]}
    />
  );
}
