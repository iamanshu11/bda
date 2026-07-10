/**
 * Central site configuration.
 * Single source of truth for name, URLs, contact + social links.
 * Consumed by SEO metadata, structured data, header and footer.
 */
export const siteConfig = {
  name: 'Bokaro Defence Academy',
  shortName: 'BDA',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  tagline: 'Molding the Brave Hearts',
  description:
    "India's most trusted and affordable defence academy for NDA, CDS, AFCAT and Agniveer preparation. Expert faculty, mock tests, video lectures and proven results.",
  locale: 'en_IN',
  keywords: [
    'Bokaro Defence Academy',
    'NDA coaching',
    'CDS coaching',
    'AFCAT preparation',
    'Agniveer coaching',
    'SSB interview',
    'defence academy Bokaro',
    'Indian Armed Forces coaching',
  ],
  contact: {
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+919525973090',
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'info@bokarodefenceacademy.com',
    address: 'Gujarati Colony, Chas, Bokaro Steel City, Jharkhand 827013, India',
  },
  social: {
    facebook: 'https://facebook.com/bokarodefenceacademy',
    instagram: 'https://instagram.com/bokarodefenceacademy',
    youtube: 'https://youtube.com/@bokarodefenceacademy',
    twitter: 'https://twitter.com/bda_official',
    telegram: 'https://t.me/bokarodefenceacademy',
  },
  ogImage: '/og-image.jpg',
} as const;

export type SiteConfig = typeof siteConfig;
