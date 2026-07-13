import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, GraduationCap, IndianRupee, PlayCircle, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { serverFetch } from '@/lib/server-api';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/JsonLd';
import { StarRating } from '@/components/ui/StarRating';
import { CoursePreview } from '@/components/courses/CoursePreview';
import { CourseReviews } from '@/components/courses/CourseReviews';
import { WishlistButton } from '@/components/courses/WishlistButton';
import { siteConfig } from '@/constants/site';
import type { ApiCourse } from '@/types/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCourse(slug: string) {
  return serverFetch<ApiCourse>(`/courses/${slug}`);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) {
    return buildMetadata({ title: 'Course', path: `/courses/${slug}` });
  }
  return buildMetadata({
    title: course.title,
    description: course.shortDesc ?? course.description ?? `${course.title} at Bokaro Defence Academy.`,
    path: `/courses/${course.slug}`,
    image: course.bannerUrl ?? undefined,
    keywords: [course.title, course.category?.name ?? ''].filter(Boolean),
  });
}

function normalizeCurriculum(curriculum: unknown): { title: string; items: string[] }[] {
  if (!Array.isArray(curriculum)) return [];
  return curriculum.map((entry, i) => {
    if (typeof entry === 'string') return { title: `Module ${i + 1}`, items: [entry] };
    const e = entry as { title?: string; items?: unknown };
    return {
      title: e.title ?? `Module ${i + 1}`,
      items: Array.isArray(e.items) ? e.items.map(String) : [],
    };
  });
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const curriculum = normalizeCurriculum(course.curriculum);
  const enrollHref = `/enroll?course=${course.id}`;

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.shortDesc ?? course.description ?? undefined,
    provider: { '@type': 'EducationalOrganization', name: siteConfig.name, sameAs: siteConfig.url },
  };

  return (
    <>
      <PageHeader
        title={course.title}
        subtitle={course.shortDesc ?? undefined}
        breadcrumbs={[
          { name: 'Courses', path: '/courses' },
          { name: course.title, path: `/courses/${course.slug}` },
        ]}
      />

      <section className="bg-background py-14">
        <Container className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          {/* Main content */}
          <div className="space-y-10">
            {course.bannerUrl && (
              <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl">
                <Image src={course.bannerUrl} alt={course.title} fill sizes="(max-width:1024px) 100vw, 720px" className="object-cover" />
              </div>
            )}

            {course.description && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">About this course</h2>
                <p className="mt-3 whitespace-pre-line text-muted">{course.description}</p>
              </div>
            )}

            {course.previewModules && course.previewModules.length > 0 && (
              <CoursePreview modules={course.previewModules} />
            )}

            {curriculum.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Curriculum</h2>
                <div className="mt-4 space-y-3">
                  {curriculum.map((mod, i) => (
                    <details key={i} className="group rounded-lg border border-border bg-surface p-4" open={i === 0}>
                      <summary className="cursor-pointer font-semibold text-foreground">{mod.title}</summary>
                      {mod.items.length > 0 && (
                        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted">
                          {mod.items.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </details>
                  ))}
                </div>
              </div>
            )}

            {course.demoVideos && course.demoVideos.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Demo videos</h2>
                <ul className="mt-4 space-y-2">
                  {course.demoVideos.map((v) => (
                    <li key={v.id}>
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-navy-600 hover:underline dark:text-navy-200">
                        <PlayCircle size={18} /> {v.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.faculties && course.faculties.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Faculty</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {course.faculties.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-600 text-sm font-bold text-white">
                        {f.name.charAt(0)}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{f.name}</p>
                        {f.designation && <p className="text-xs text-muted">{f.designation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.faqs && course.faqs.length > 0 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">FAQs</h2>
                <div className="mt-4 space-y-3">
                  {course.faqs.map((faq) => (
                    <details key={faq.id} className="rounded-lg border border-border bg-surface p-4">
                      <summary className="cursor-pointer font-semibold text-foreground">{faq.question}</summary>
                      <p className="mt-2 text-sm text-muted">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            <CourseReviews slug={course.slug} courseId={course.id} />
          </div>

          {/* Sticky enroll card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                {course.badge ? (
                  <span className="inline-block rounded-md bg-navy-50 px-2.5 py-1 text-xs font-bold text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                    {course.badge}
                  </span>
                ) : <span />}
                <WishlistButton courseId={course.id} />
              </div>
              {course.rating && course.rating.count > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <StarRating value={course.rating.average} size={15} />
                  <span>{course.rating.average} ({course.rating.count})</span>
                </div>
              )}
              <ul className="mt-4 space-y-3 text-sm">
                {course.fees ? (
                  <li className="flex items-center gap-2 text-foreground">
                    <IndianRupee size={16} className="text-navy-500" />
                    <span className="font-semibold">₹{course.fees}</span>
                  </li>
                ) : null}
                {course.durationWeeks ? (
                  <li className="flex items-center gap-2 text-muted">
                    <Clock size={16} className="text-navy-500" /> {course.durationWeeks} weeks
                  </li>
                ) : null}
                {course.category?.name && (
                  <li className="flex items-center gap-2 text-muted">
                    <GraduationCap size={16} className="text-navy-500" /> {course.category.name}
                  </li>
                )}
                {course.faculties && (
                  <li className="flex items-center gap-2 text-muted">
                    <Users size={16} className="text-navy-500" /> {course.faculties.length} faculty
                  </li>
                )}
              </ul>
              <Button href={enrollHref} size="lg" className="mt-6 w-full">
                Enroll Now <ArrowRight size={18} />
              </Button>
              <Link href="/contact" className="mt-3 block text-center text-sm text-navy-600 hover:underline dark:text-navy-200">
                Have questions? Contact us
              </Link>
            </div>
          </aside>
        </Container>
      </section>

      <JsonLd data={courseJsonLd} />
    </>
  );
}
