import { buildMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { CourseSelector } from '@/components/enroll/CourseSelector';

export const metadata = buildMetadata({
  title: 'Enroll Now',
  description:
    'Enroll at Bokaro Defence Academy. Pick your course — NDA, CDS, AFCAT, Agniveer and more — and start preparing with expert guidance.',
  path: '/enroll',
  keywords: ['enroll Bokaro Defence Academy', 'defence academy admission'],
});

export default async function EnrollPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;

  return (
    <>
      <PageHeader
        title="Enroll Now"
        subtitle="Select a course to begin your journey towards the Indian Armed Forces."
        breadcrumbs={[{ name: 'Enroll', path: '/enroll' }]}
      />
      <CourseSelector initialCourse={course} />
    </>
  );
}
