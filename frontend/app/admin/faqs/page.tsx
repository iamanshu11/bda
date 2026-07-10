'use client';

import { ResourceManager } from '@/components/dashboard/ResourceManager';

export default function AdminFaqsPage() {
  return (
    <ResourceManager
      title="FAQs"
      endpoint="/admin/faqs"
      columns={[
        { key: 'question', label: 'Question' },
        { key: 'order', label: 'Order' },
      ]}
      fields={[
        { name: 'question', label: 'Question', required: true },
        { name: 'answer', label: 'Answer', type: 'textarea', required: true },
        { name: 'order', label: 'Order', type: 'number' },
      ]}
    />
  );
}
