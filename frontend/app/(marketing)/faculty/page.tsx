import Image from 'next/image';
import { buildMetadata } from '@/lib/seo';
import { serverFetch } from '@/lib/server-api';
import { PageHeader } from '@/components/layout/PageHeader';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { facultyMembers } from '@/frontend-data/pages';
import type { ApiFaculty } from '@/types/api';

export const metadata = buildMetadata({
  title: 'Our Faculty',
  description:
    'Learn from ex-armed forces officers and subject experts at Bokaro Defence Academy. Meet the mentors guiding cadets to NDA, CDS and AFCAT success.',
  path: '/faculty',
  keywords: ['BDA faculty', 'defence coaching mentors', 'SSB mentor Bokaro'],
});

const fallback: ApiFaculty[] = facultyMembers.map((m) => ({
  id: m.id,
  name: m.name,
  slug: m.id,
  designation: m.designation,
  photoUrl: m.image,
  expertise: m.expertise,
}));

export default async function FacultyPage() {
  const live = await serverFetch<ApiFaculty[]>('/faculty');
  const members = live && live.length > 0 ? live : fallback;

  return (
    <>
      <PageHeader
        title="Our Faculty"
        subtitle="Ex-armed forces officers and subject-matter experts dedicated to your success."
        breadcrumbs={[{ name: 'Faculty', path: '/faculty' }]}
      />

      <section className="bg-background py-20">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member, i) => (
              <Reveal as="article" key={member.id} index={i % 3}>
                <div className="group overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-navy-50 dark:bg-navy-900">
                    {member.photoUrl ? (
                      <Image
                        src={member.photoUrl}
                        alt={member.name}
                        fill
                        sizes="(max-width: 1024px) 90vw, 360px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="font-heading text-4xl font-bold text-navy-300">
                        {member.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg font-bold text-foreground">{member.name}</h3>
                    {member.designation && (
                      <p className="text-sm font-medium text-rust-600 dark:text-rust-300">
                        {member.designation}
                      </p>
                    )}
                    {member.expertise && member.expertise.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {member.expertise.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700 dark:bg-navy-800 dark:text-navy-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
