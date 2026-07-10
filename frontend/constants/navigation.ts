export interface NavItem {
  label: string;
  href: string;
}

/** Primary header navigation. Add page routes here as new pages ship. */
export const mainNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Results', href: '/results' },
  { label: 'Faculty', href: '/faculty' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

/** Footer link groups. */
export const footerNav = {
  studyMaterial: {
    title: 'Study Material',
    links: [
      { label: 'Class 10 Solutions', href: '/study-material/class-10' },
      { label: 'Class 12 Notes', href: '/study-material/class-12' },
      { label: 'Previous Papers', href: '/study-material/previous-papers' },
      { label: 'Exam Syllabus', href: '/study-material/syllabus' },
    ],
  },
  govtExams: {
    title: 'Govt Exams',
    links: [
      { label: 'NDA Exam', href: '/courses/nda' },
      { label: 'CDS Exam', href: '/courses/cds' },
      { label: 'AFCAT Exam', href: '/courses/afcat' },
      { label: 'Navy SSR', href: '/courses/navy-ssr' },
    ],
  },
  channels: {
    title: 'Our Channels',
    links: [
      { label: 'BDA Official', href: '#' },
      { label: 'Defence Wallah', href: '#' },
      { label: 'SSB Preparation', href: '#' },
      { label: 'Fitness Guide', href: '#' },
    ],
  },
};
