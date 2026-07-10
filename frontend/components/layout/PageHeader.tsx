import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

interface Crumb {
  name: string;
  path: string;
}

/**
 * Reusable inner-page hero with breadcrumbs.
 * Emits BreadcrumbList JSON-LD for SEO automatically.
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
}) {
  const crumbs: Crumb[] = [{ name: 'Home', path: '/' }, ...breadcrumbs];

  return (
    <section className="relative overflow-hidden bg-navy-800">
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900 to-navy-700/70" />
      <Container className="relative py-16 md:py-20">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-navy-100/70">
          {crumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} />}
              {i < crumbs.length ? (
                <Link href={crumb.path} className="transition-colors hover:text-white">
                  {crumb.name}
                </Link>
              ) : (
                <span className="text-white">{crumb.name}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-4 font-heading text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-navy-100/85">{subtitle}</p>}
      </Container>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </section>
  );
}
