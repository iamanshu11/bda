import { buildMetadata } from '@/lib/seo';
import { serverFetch } from '@/lib/server-api';
import { PageHeader } from '@/components/layout/PageHeader';
import { CourseCatalog } from '@/components/courses/CourseCatalog';
import type { ApiCategory, ApiCourse } from '@/types/api';
import { featuredCourses, examCategories } from '@/frontend-data/home';

export const metadata = buildMetadata({
  title: 'Courses & Exam Categories',
  description:
    'Explore Bokaro Defence Academy courses for NDA, CDS, AFCAT, Agniveer, SSC, Police and Railway. Foundation and guarantee batches led by expert faculty.',
  path: '/courses',
  keywords: ['NDA course', 'CDS course', 'Agniveer batch', 'SSC coaching Bokaro'],
});

// Sample data used only when the API is unreachable, so the page never breaks.
const fallbackCourses: ApiCourse[] = featuredCourses.map((c) => ({
  id: c.id,
  title: c.title,
  slug: c.id,
  badge: c.badge,
  badgeType: c.badgeType === 'foundation' ? 'FOUNDATION' : 'GUARANTEE',
  shortDesc: c.description,
  category: null,
}));

const fallbackCategories: ApiCategory[] = examCategories.map((c) => ({
  id: c.id,
  name: c.title,
  slug: c.id,
}));

export default async function CoursesPage() {
  const [courses, categories] = await Promise.all([
    serverFetch<ApiCourse[]>('/courses?limit=50'),
    serverFetch<ApiCategory[]>('/categories'),
  ]);

  return (
    <>
      <PageHeader
        title="Courses & Exam Categories"
        subtitle="Choose your path to glory in the Indian Armed Forces and government services."
        breadcrumbs={[{ name: 'Courses', path: '/courses' }]}
      />
      <CourseCatalog
        courses={courses && courses.length > 0 ? courses : fallbackCourses}
        categories={categories && categories.length > 0 ? categories : fallbackCategories}
      />
    </>
  );
}
