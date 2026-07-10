import Image from 'next/image';
import { buildMetadata } from '@/lib/seo';
import { serverFetch } from '@/lib/server-api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { achievers } from '@/frontend-data/home';
import type { ApiHallOfFame, ApiResult } from '@/types/api';

export const metadata = buildMetadata({
  title: 'Results & Achievers',
  description:
    'Meet the toppers of Bokaro Defence Academy. Proven results across NDA, CDS, AFCAT and Navy examinations — our Hall of Fame and yearly achievers.',
  path: '/results',
  keywords: ['BDA results', 'NDA toppers Bokaro', 'defence academy results'],
});

const fallbackHof: ApiHallOfFame[] = achievers.map((a) => ({
  id: a.id,
  name: a.name,
  rank: a.rank,
  exam: a.exam,
  photoUrl: a.image,
}));

export default async function ResultsPage() {
  const data = await serverFetch<{ results: ApiResult[]; hallOfFame: ApiHallOfFame[] }>('/results');
  const hallOfFame = data && data.hallOfFame.length > 0 ? data.hallOfFame : fallbackHof;
  const results = data?.results ?? [];

  return (
    <>
      <PageHeader
        title="Results & Achievers"
        subtitle="Giving wings to a million dreams — celebrating the cadets who made it."
        breadcrumbs={[{ name: 'Results', path: '/results' }]}
      />

      {/* Hall of Fame */}
      <section className="bg-navy-800 py-20">
        <Container>
          <h2 className="mb-10 text-center font-heading text-2xl font-bold text-white sm:text-3xl">
            Academic Excellence: Hall of Fame
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {hallOfFame.map((a, i) => (
              <Reveal as="article" key={a.id} index={i % 4}>
                <figure className="rounded-2xl bg-navy-700/60 p-5 text-center ring-1 ring-white/10">
                  <div className="relative mx-auto aspect-square w-24 overflow-hidden rounded-lg bg-navy-600 ring-2 ring-rust-400">
                    {a.photoUrl ? (
                      <Image src={a.photoUrl} alt={`${a.name}, ${a.rank}`} fill sizes="96px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-heading text-2xl font-bold text-white">
                        {a.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <figcaption className="mt-4">
                    <p className="font-heading text-lg font-bold text-rust-300">{a.rank}</p>
                    <p className="mt-1 font-semibold text-white">{a.name}</p>
                    <p className="text-sm text-navy-100/70">{a.exam}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Recent selections (live results) */}
      {results.length > 0 && (
        <section className="bg-background py-20">
          <Container>
            <h2 className="mb-10 text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Recent Selections
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r, i) => (
                <Reveal as="article" key={r.id} index={i % 3}>
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-600 font-heading text-sm font-bold text-white">
                      {r.rank.replace(/AIR\s*/i, '#')}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{r.studentName}</p>
                      <p className="text-sm text-muted">
                        {r.exam}
                        {r.year ? ` · ${r.year}` : ''}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
