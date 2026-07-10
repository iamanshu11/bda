import type { MetadataRoute } from 'next';
import { siteConfig } from '@/constants/site';

/**
 * Static routes for the sitemap. As dynamic pages (courses, blogs) go live,
 * fetch their slugs here and map them into additional entries.
 */
const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/results', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/faculty', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/gallery', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/enroll', priority: 0.8, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return staticRoutes.map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
