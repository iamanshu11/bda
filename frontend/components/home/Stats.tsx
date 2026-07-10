import { Container } from '@/components/ui/Container';
import { Counter } from '@/components/ui/Counter';
import { stats } from '@/frontend-data/home';

export function Stats() {
  return (
    <section className="bg-background py-14" aria-label="Key statistics">
      <Container>
        <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 text-center">
              <dd className="font-heading text-3xl font-extrabold text-navy-600 dark:text-navy-200 sm:text-4xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="mt-1 text-sm font-medium text-muted sm:text-base">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
