'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { examCategories, examFilters, totalCategories } from '@/frontend-data/home';

const accentIcon: Record<string, string> = {
  navy: 'bg-navy-50 text-navy-600 dark:bg-navy-800 dark:text-navy-200',
  olive: 'bg-olive-500/10 text-olive-600 dark:text-olive-500',
  rust: 'bg-rust-50 text-rust-600 dark:bg-rust-900/40 dark:text-rust-300',
};

export function ExamCategories() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="bg-background py-20" aria-label="Exam categories">
      <Container>
        <SectionHeading
          eyebrow="Exam Categories"
          title="Choose your path to glory in the Indian Armed Forces"
        />

        {/* Filter pills (visual filter over highlight) */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {examFilters.map((filter) => {
            const isActive = active === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActive(isActive ? null : filter)}
                className={cn(
                  'rounded-full border px-5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-navy-600 bg-navy-600 text-white'
                    : 'border-border bg-background text-foreground hover:border-navy-400 hover:text-navy-600',
                )}
                aria-pressed={isActive}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {examCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Reveal as="article" key={cat.id} index={i}>
                <Link
                  href={cat.href}
                  className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:border-navy-300 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-lg',
                        accentIcon[cat.accent],
                      )}
                    >
                      <Icon size={22} />
                    </span>
                    <h3 className="font-heading text-lg font-bold text-foreground">{cat.title}</h3>
                  </div>
                  <p className="mt-4 flex-1 text-sm text-muted">{cat.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground">
                    Explore
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/courses"
            className="font-bold text-navy-600 underline-offset-4 hover:underline dark:text-navy-200"
          >
            View All Categories ({totalCategories})
          </Link>
        </div>
      </Container>
    </section>
  );
}
