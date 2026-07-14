import {
  Award,
  Medal,
  ShieldCheck,
  TrainFront,
  Footprints,
  Laptop,
  BookOpen,
  Dumbbell,
  Building2,
  Library,
} from 'lucide-react';
import type {
  Achiever,
  Course,
  ExamCategory,
  Facility,
  Stat,
  StudyResource,
} from '@/types';

/**
 * Static homepage content.
 * This mirrors the shape the backend APIs will return, so swapping to live
 * data later is a drop-in replacement (fetch -> same types).
 */

export const heroContent = {
  tagline: 'Dream. Discipline. Defend',
  title: 'Molding the Brave Hearts',
  subtitle: "India's most trusted academy for NDA, CDS, and AFCAT excellence.",
  ctaLabel: 'Get Started',
  ctaHref: '/courses',
  backgroundImage: '/img/hero-bg.png',
};

export const stats: Stat[] = [
  { value: 5000, suffix: '+', label: 'Happy Students' },
  { value: 24000, suffix: '+', label: 'Mock Tests' },
  { value: 14000, suffix: '+', label: 'Video Lectures' },
  { value: 100, suffix: '+', label: 'Expert Faculty' },
];

export const aboutContent = {
  heading: [
    { text: "India's ", highlight: false },
    { text: 'Trusted ', highlight: true },
    { text: '& ', highlight: false },
    { text: 'Affordable ', highlight: true },
    { text: 'Defence Academy', highlight: false },
  ],
  body: 'Unlock your potential by signing up with Bokaro Defence Academy - The most affordable learning solution for future officers.',
  ctaLabel: 'Get Started',
  ctaHref: '/about',
  image: '/img/trust.jpeg',
  chips: [
    { side: 'left', text: 'Sir, What is BDA?' },
    {
      side: 'right',
      text: 'BDA is where students learn with discipline and can grow with guidance.',
    },
  ] as const,
};

export const examFilters = ['NDA', 'CDS', 'Airforce', 'Navy', 'SSB Interview'];

export const examCategories: ExamCategory[] = [
  {
    id: 'nda-cds',
    title: 'NDA & CDS',
    description: 'NDA, CDS, AFCAT, Agniveer',
    icon: Medal,
    href: '/courses',
    accent: 'navy',
  },
  {
    id: 'army-navy',
    title: 'Army & Navy',
    description: 'Army (GD, Tradesman), Navy (SSR, Merchant Navy), Airforce (X & Y)',
    icon: Footprints,
    href: '/courses',
    accent: 'olive',
  },
  {
    id: 'police-ssc',
    title: 'Police & SSC',
    description: 'Bihar Police (Constable, Daroga), SSC (GD, MTS, CHSL, CGL, CPO)',
    icon: ShieldCheck,
    href: '/courses',
    accent: 'olive',
  },
  {
    id: 'railway',
    title: 'Railway',
    description: 'Group-D, NTPC, RPF',
    icon: TrainFront,
    href: '/courses',
    accent: 'navy',
  },
];

export const totalCategories = 20;

export const featuredCourses: Course[] = [
  {
    id: 'nda',
    title: 'NDA',
    badge: 'Foundation Batch',
    badgeType: 'foundation',
    description: '11th + 12th + NDA Preparation',
    href: '/courses',
  },
  {
    id: 'agniveer',
    title: 'Agniveer',
    badge: 'Guarantee Batch',
    badgeType: 'guarantee',
    description: 'Intensive training for Agniveer selection',
    href: '/courses',
  },
  {
    id: 'ssc-gd',
    title: 'SSC GD',
    badge: 'Guarantee Batch',
    badgeType: 'guarantee',
    description: 'Comprehensive SSC GD preparation',
    href: '/courses',
  },
  {
    id: 'bihar-police',
    title: 'Bihar Police',
    badge: 'Guarantee Batch',
    badgeType: 'guarantee',
    description: 'Targeted training for Bihar Police exams',
    href: '/courses',
  },
];

export const achievers: Achiever[] = [
  {
    id: '1',
    name: 'Rohan Singh',
    rank: 'AIR 42',
    exam: 'NDA 2023',
    image:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '2',
    name: 'Ananya Verma',
    rank: 'AIR 115',
    exam: 'AFCAT 2023',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '3',
    name: 'Vikram Aditya',
    rank: 'AIR 89',
    exam: 'CDS 2022',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    rank: 'AIR 204',
    exam: 'Navy Tech',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '5',
    name: 'Arjun Mehta',
    rank: 'AIR 156',
    exam: 'NDA 2022',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
];

export const studyResources: StudyResource[] = [
  {
    id: 'reference-books',
    title: 'Reference Books',
    description:
      'Our experts have created thorough study materials that break down complicated concepts into easily understandable content.',
    image: '/logo.png',
    href: '/study-material/reference-books',
    accent: 'navy',
  },
  {
    id: 'ncert-solutions',
    title: 'NCERT Solutions',
    description:
      "Unlock academic excellence with BDA's NCERT Solutions which provides you step-by-step solutions.",
    image: '/logo.png',
    href: '/study-material/ncert-solutions',
    accent: 'rust',
  },
  {
    id: 'notes',
    title: 'Notes',
    description:
      "Use BDA's detailed study materials that simplify complex ideas into easily understandable language.",
    image: '/logo.png',
    href: '/study-material/notes',
    accent: 'olive',
  },
];

export const facilities: Facility[] = [
  { id: 'digital-classroom', title: 'Digital Classroom', icon: Laptop },
  { id: 'library', title: 'Library Facilities', icon: Library },
  { id: 'physical-training', title: 'Physical Training', icon: Award },
  { id: 'hostel', title: 'Hostel Facilities', icon: Building2 },
  { id: 'gym', title: 'Gym Facilities', icon: Dumbbell },
];

// Keep BookOpen imported for future study-material blocks
export const _iconRegistry = { BookOpen };
