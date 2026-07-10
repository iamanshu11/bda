'use client';

import { use } from 'react';
import { ModuleManager } from '@/components/admin/ModuleManager';

export default function AdminCourseModulesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  return <ModuleManager courseId={courseId} />;
}
