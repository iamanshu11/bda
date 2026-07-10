'use client';

import { use } from 'react';
import { LearningView } from '@/components/learn/LearningView';

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  return <LearningView courseId={courseId} />;
}
