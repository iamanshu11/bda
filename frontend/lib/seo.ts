import type { Metadata } from 'next';
import { siteConfig } from '@/constants/site';

const siteUrl = siteConfig.url;

export interface SeoParams {
  /** Page-specific title. Rendered as "Title | Bokaro Defence Academy". */
  title?: string;
  /** Meta description (~150-160 chars ideal). Falls back to site default. */
  description?: string;
  /** Path relative to the site root, e.g. "/courses/nda". Used for canonical + OG url. */
  path?: string;
  /** Extra keywords merged with the site defaults. */
  keywords?: string[];
  /** Absolute or root-relative OG image. Falls back to the default OG image. */
  image?: string;
  /** Set true on pages that should not be indexed (dashboards, auth, etc.). */
  noIndex?: boolean;
  /** OG type. Use "article" for blog posts. */
  type?: 'website' | 'article';
}

/**
 * Build a complete Next.js Metadata object for any page.
 *
 * Every future page (Courses, Results, Faculty, blog posts...) should call this
 * helper from its `generateMetadata` / exported `metadata` so SEO stays
 * consistent and only needs to be maintained in one place.
 *
 * @example
 * export const metadata = buildMetadata({
 *   title: 'NDA Coaching',
 *   description: 'Best NDA coaching in Bokaro...',
 *   path: '/courses/nda',
 * });
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  keywords = [],
  image = siteConfig.ogImage,
  noIndex = false,
  type = 'website',
}: SeoParams = {}): Metadata {
  const url = new URL(path, siteUrl).toString();
  const resolvedImage = image.startsWith('http')
    ? image
    : new URL(image, siteUrl).toString();

  const fullTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} | ${siteConfig.tagline}`;

  return {
    metadataBase: new URL(siteUrl),
    title: fullTitle,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name, url: siteUrl }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [{ url: resolvedImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [resolvedImage],
      creator: '@bda_official',
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

/* ---------------------------------------------------------------------------
 * Structured data (JSON-LD) builders
 * ------------------------------------------------------------------------- */

/** Organization / EducationalOrganization schema for the site root. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    slogan: siteConfig.tagline,
    url: siteConfig.url,
    logo: new URL('/logo.png', siteUrl).toString(),
    description: siteConfig.description,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address,
      addressLocality: 'Bokaro',
      addressRegion: 'Jharkhand',
      addressCountry: 'IN',
    },
    sameAs: Object.values(siteConfig.social),
  };
}

/** WebSite schema with a search action (Sitelinks search box). */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Reusable breadcrumb schema builder for inner pages. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.path, siteUrl).toString(),
    })),
  };
}
