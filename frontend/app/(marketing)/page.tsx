import { buildMetadata } from '@/lib/seo';
import {
  Hero,
  Stats,
  About,
  ExamCategories,
  FeaturedCourses,
  HallOfFame,
  StudyResources,
  Facilities,
} from '@/components/home';

// Page-level SEO. Uses site defaults for the homepage but is explicit so the
// canonical URL + OG data are locked to "/".
export const metadata = buildMetadata({
  path: '/',
  description:
    'Dream. Discipline. Defend — Bokaro Defence Academy, India\'s most trusted & affordable academy for NDA, CDS, AFCAT & Agniveer. Expert faculty, 24,000+ mock tests, 14,000+ video lectures and proven results.',
  keywords: ['Dream. Discipline. Defend', 'Dream Discipline Defend', 'Molding the Brave Hearts'],
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <About />
      <ExamCategories />
      <FeaturedCourses />
      <HallOfFame />
      <StudyResources />
      <Facilities />
    </>
  );
}
