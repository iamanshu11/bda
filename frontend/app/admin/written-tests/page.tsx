'use client';

import Link from 'next/link';
import { ResourceManager } from '@/components/dashboard/ResourceManager';
import { WrittenTestQuestions } from '@/components/admin/WrittenTestQuestions';
import { useState } from 'react';

export default function AdminWrittenTestsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <ResourceManager
        title="Written Tests"
        endpoint="/admin/written-tests"
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'price', label: 'Price (₹)' },
          { key: 'totalQuestions', label: 'Questions' },
          { key: 'status', label: 'Status' },
          {
            key: 'secure',
            label: 'Questions',
            render: (r) => (
              <button
                type="button"
                className="font-semibold text-navy-600 hover:underline dark:text-navy-200"
                onClick={() => setSelectedId(String(r.id))}
              >
                Manage questions
              </button>
            ),
          },
          {
            key: 'results',
            label: 'Results',
            render: (r) => (
              <Link
                href={`/admin/written-tests/${r.id}/results`}
                className="font-semibold text-navy-600 hover:underline dark:text-navy-200"
              >
                View
              </Link>
            ),
          },
        ]}
        fields={[
          { name: 'title', label: 'Title', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'instructions', label: 'Instructions', type: 'textarea' },
          { name: 'price', label: 'Price (₹)', type: 'number', placeholder: '299' },
          { name: 'durationMins', label: 'Duration (minutes)', type: 'number' },
          {
            name: 'marksPerQuestion',
            label: 'Marks per question (correct)',
            type: 'number',
            placeholder: '4',
            defaultValue: 4,
          },
          {
            name: 'negativeMark',
            label: 'Negative mark (wrong answer)',
            type: 'number',
            placeholder: '0.25',
            defaultValue: 0.25,
          },
          { name: 'passingMarks', label: 'Passing marks', type: 'number' },
          { name: 'availableFrom', label: 'Available from', type: 'datetime', required: true },
          { name: 'availableTo', label: 'Available to', type: 'datetime', required: true },
          { name: 'answersRevealAt', label: 'Answers reveal at', type: 'datetime' },
          { name: 'maxCheatingAttempts', label: 'Max cheating attempts', type: 'number', placeholder: '3', defaultValue: 3 },
          { name: 'offlineAutoSubmitMins', label: 'Offline auto-submit (mins)', type: 'number', defaultValue: 5 },
          {
            name: 'shuffle',
            label: 'Shuffle questions',
            type: 'checkbox',
            defaultValue: true,
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ARCHIVED', label: 'Archived' },
            ],
          },
        ]}
      />

      {selectedId && (
        <WrittenTestQuestions testId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
