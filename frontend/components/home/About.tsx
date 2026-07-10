import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { aboutContent } from '@/frontend-data/home';

export function About() {
  return (
    <section className="bg-surface-alt py-20" aria-label="About Bokaro Defence Academy">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        {/* Copy */}
        <Reveal>
          <h2 className="font-heading text-3xl font-extrabold leading-tight text-foreground sm:text-4xl md:text-5xl">
            {aboutContent.heading.map((part, i) => (
              <span key={i} className={part.highlight ? 'text-navy-500' : undefined}>
                {part.text}
              </span>
            ))}
          </h2>
          <p className="mt-6 max-w-md text-base text-muted">{aboutContent.body}</p>
          <div className="mt-8">
            <Button href={aboutContent.ctaHref} variant="secondary" size="lg">
              {aboutContent.ctaLabel}
              <ArrowRight size={18} />
            </Button>
          </div>
        </Reveal>

        {/* Image with chat chips */}
        <Reveal index={1} className="relative mx-auto w-full max-w-md">
          <div className="relative rounded-2xl border-2 border-dashed border-navy-200 p-4 dark:border-navy-700">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
              <Image
                src={aboutContent.image}
                alt="A commissioned officer, a Bokaro Defence Academy alumnus"
                fill
                sizes="(max-width: 1024px) 90vw, 400px"
                className="object-cover"
              />
            </div>

            {/* Left chip */}
            <span className="absolute -left-2 -top-3 rounded-full bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-lg ring-1 ring-border">
              {aboutContent.chips[0].text}
            </span>
            {/* Right chip */}
            <span className="absolute -bottom-4 right-2 max-w-[220px] rounded-xl bg-navy-700 px-4 py-3 text-xs font-medium text-white shadow-lg">
              {aboutContent.chips[1].text}
            </span>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
