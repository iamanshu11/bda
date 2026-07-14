import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { heroContent } from '@/frontend-data/home';

/**
 * Full-viewport hero. Image is anchored toward the right so the flag + cadet
 * stay in frame; copy sits on the left over the darker overlay.
 */
export function Hero() {
  return (
    <section
      className="relative isolate flex min-h-[100svh] overflow-hidden bg-navy-900 md:min-h-[min(100svh,880px)]"
      aria-label="Introduction"
    >
      {/*
        object-position biases right (flag + person) and slightly up (flag mast).
        Mobile uses a bit more center-right so both subjects stay comfortable.
      */}
      <Image
        src={heroContent.backgroundImage}
        alt="Cadets training at Bokaro Defence Academy"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[94%_32%] sm:object-[72%_28%] lg:object-[78%_30%] xl:object-[82%_28%]"
      />

      {/* Stronger left fade for headline contrast; lighter on the right so flag/person stay clear */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/70 to-navy-950/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-navy-950/20" />

      <Container className="relative flex w-full flex-1 flex-col justify-center py-24 md:py-28">
        <div className="max-w-xl animate-fade-up lg:max-w-2xl">
          <p className="mb-4 font-heading text-sm font-bold uppercase tracking-[0.28em] text-rust-400 sm:text-base">
            {heroContent.tagline}
          </p>
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
            {heroContent.title}
          </h1>
          <p className="mt-5 max-w-md text-lg text-navy-100/90">{heroContent.subtitle}</p>
          <div className="mt-8">
            <Button href={heroContent.ctaHref} size="lg">
              {heroContent.ctaLabel}
              <ArrowRight size={18} className="shrink-0" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
