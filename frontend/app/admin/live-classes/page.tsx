'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminLiveClassesPage() {
  return (
    <ResourceManager
      title="Live Classes"
      endpoint="/admin/live-classes"
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'course', label: 'Course', render: (r) => (r.course as { title?: string })?.title ?? 'All students' },
        {
          key: 'scheduledAt',
          label: 'When',
          render: (r) => (r.scheduledAt ? new Date(r.scheduledAt as string).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'),
        },
      ]}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'scheduledAt', label: 'Scheduled date & time', type: 'datetime' },
        { name: 'durationMins', label: 'Duration (mins)', type: 'number' },
        { name: 'meetingUrl', label: 'Meeting link', placeholder: 'https://meet.google.com/…' },
        { name: 'courseId', label: 'Course ID (optional — leave blank for all)', placeholder: 'course uuid' },
      ]}
    />
  );
}
