import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Button } from '@/components/ui/Button';
import { studyResources } from '@/frontend-data/home';

const titleAccent: Record<string, string> = {
  navy: 'text-navy-600 dark:text-navy-200',
  rust: 'text-rust-600 dark:text-rust-300',
  olive: 'text-olive-600 dark:text-olive-500',
};

const btnAccent: Record<string, 'secondary' | 'primary' | 'outline'> = {
  navy: 'outline',
  rust: 'primary',
  olive: 'outline',
};

export function StudyResources() {
  return (
    <section className="bg-surface-alt py-20" aria-label="Study resources">
      <Container>
        <SectionHeading
          eyebrow="Study Resources"
          title="A diverse array of learning materials to enhance your journey"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {studyResources.map((res, i) => (
            <Reveal as="article" key={res.id} index={i}>
              <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-6">
                <h3 className={cn('font-heading text-xl font-bold', titleAccent[res.accent])}>
                  {res.title}
                </h3>
                <p className="mt-3 flex-1 text-sm text-muted">{res.description}</p>
                <div className="relative my-6 flex h-40 items-center justify-center rounded-lg bg-navy-50 dark:bg-navy-900/50">
                  <Image
                    src={res.image}
                    alt={`${res.title} — Bokaro Defence Academy`}
                    width={110}
                    height={110}
                    className="h-24 w-24 object-contain opacity-90"
                  />
                </div>
                <Button href={res.href} variant={btnAccent[res.accent]} size="md" className="w-full">
                  Explore
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
