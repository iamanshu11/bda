import type { MetadataRoute } from 'next';
import { siteConfig } from '@/constants/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private/auth areas out of the index as they ship.
        disallow: ['/dashboard', '/admin', '/login', '/signup', '/api'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
