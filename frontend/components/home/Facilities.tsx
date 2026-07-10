import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { facilities } from '@/frontend-data/home';

export function Facilities() {
  return (
    <section className="bg-navy-100 py-20 dark:bg-navy-900" aria-label="Our facilities">
      <Container>
        <SectionHeading
          eyebrow="Our Facilities"
          title="World-class infrastructure for your holistic development"
        />

        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {facilities.map((facility, i) => {
            const Icon = facility.icon;
            return (
              <Reveal key={facility.id} index={i} className="flex flex-col items-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-navy-600 shadow-sm dark:text-navy-200">
                  <Icon size={28} />
                </span>
                <p className="mt-4 font-semibold text-foreground">{facility.title}</p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
