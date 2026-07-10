import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { featuredCourses } from '@/frontend-data/home';

export function FeaturedCourses() {
  return (
    <section className="bg-surface-alt py-20" aria-label="Featured courses">
      <Container>
        <SectionHeading
          eyebrow="My Main Courses"
          title="Specialized batches with guaranteed success paths"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredCourses.map((course, i) => (
            <Reveal as="article" key={course.id} index={i}>
              <Link
                href={course.href}
                className="group flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span
                  className={cn(
                    'h-1.5 w-full',
                    course.badgeType === 'foundation' ? 'bg-rust-500' : 'bg-navy-600',
                  )}
                />
                <div className="flex flex-1 flex-col p-6">
                  <span
                    className={cn(
                      'inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-bold',
                      course.badgeType === 'foundation'
                        ? 'bg-rust-50 text-rust-700 dark:bg-rust-900/40 dark:text-rust-300'
                        : 'bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
                    )}
                  >
                    {course.badge}
                  </span>
                  <h3 className="mt-4 font-heading text-xl font-bold text-foreground">
                    {course.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted">{course.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-navy-600 dark:text-navy-200">
                    View Course
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
