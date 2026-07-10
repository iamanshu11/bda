import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { heroContent } from '@/frontend-data/home';

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-900" aria-label="Introduction">
      {/* Background image */}
      <Image
        src={heroContent.backgroundImage}
        alt="Cadets training at Bokaro Defence Academy"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Overlays for legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/80 to-navy-900/40" />
      <div className="absolute inset-0 bg-navy-950/20" />

      <Container className="relative flex min-h-[560px] flex-col justify-center py-24 md:min-h-[640px]">
        <div className="max-w-2xl animate-fade-up">
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
            {heroContent.title}
          </h1>
          <p className="mt-5 max-w-md text-lg text-navy-100/90">{heroContent.subtitle}</p>
          <div className="mt-8">
            <Button href={heroContent.ctaHref} size="lg">
              {heroContent.ctaLabel}
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
