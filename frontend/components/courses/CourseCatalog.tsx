'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { WishlistButton } from '@/components/courses/WishlistButton';
import type { ApiCategory, ApiCourse } from '@/types/api';

/**
 * Interactive course catalog: category filter pills + course cards linking to
 * each course's detail page. Data is passed in from the server (live API).
 */
export function CourseCatalog({
  courses,
  categories,
}: {
  courses: ApiCourse[];
  categories: ApiCategory[];
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesCategory = !activeSlug || c.category?.slug === activeSlug;
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.shortDesc ?? '').toLowerCase().includes(q) ||
        (c.category?.name ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [courses, activeSlug, query]);

  return (
    <section className="bg-background py-16">
      <Container>
        <div className="mx-auto mb-8 max-w-md">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSlug(null)}
              className={cn(
                'rounded-full border px-5 py-2 text-sm font-medium transition-colors',
                !activeSlug ? 'border-navy-600 bg-navy-600 text-white' : 'border-border text-foreground hover:border-navy-400',
              )}
            >
              All
            </button>
            {categories.map((cat) => {
              const isActive = activeSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveSlug(isActive ? null : cat.slug)}
                  className={cn(
                    'rounded-full border px-5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'border-navy-600 bg-navy-600 text-white' : 'border-border text-foreground hover:border-navy-400',
                  )}
                  aria-pressed={isActive}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-muted">No courses in this category yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course, i) => (
              <Reveal as="article" key={course.id} index={i % 3}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <span
                    className={cn(
                      'h-1.5 w-full',
                      course.badgeType === 'FOUNDATION' ? 'bg-rust-500' : 'bg-navy-600',
                    )}
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-600 dark:bg-navy-800 dark:text-navy-200">
                        <BookOpen size={20} />
                      </span>
                      {course.badge && (
                        <span className="rounded-md bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                          {course.badge}
                        </span>
                      )}
                      <span className="ml-auto">
                        <WishlistButton courseId={course.id} />
                      </span>
                    </div>
                    <h3 className="mt-4 font-heading text-lg font-bold text-foreground">{course.title}</h3>
                    {course.category?.name && <p className="text-xs text-muted">{course.category.name}</p>}
                    {course.shortDesc && <p className="mt-2 flex-1 text-sm text-muted">{course.shortDesc}</p>}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted">
                        {course.durationWeeks ? <span>{course.durationWeeks} wks</span> : null}
                        {course.fees ? <span className="font-semibold text-foreground">₹{course.fees}</span> : null}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-navy-600 dark:text-navy-200">
                        View <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
