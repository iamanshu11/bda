/**
 * Static content for inner pages. Shaped to match the backend API responses
 * (GET /faculty, /gallery, /results…) so each can switch to live data later.
 */

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  expertise: string[];
  image: string;
}

export const facultyMembers: FacultyMember[] = [
  {
    id: '1',
    name: 'Col. (Retd.) R. K. Sharma',
    designation: 'Director & SSB Mentor',
    expertise: ['SSB Interview', 'Personality Development'],
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '2',
    name: 'Dr. Anjali Mishra',
    designation: 'Head of Mathematics',
    expertise: ['NDA Maths', 'CDS Maths'],
    image:
      'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '3',
    name: 'Wg. Cdr. (Retd.) S. Nair',
    designation: 'AFCAT & Airforce Faculty',
    expertise: ['AFCAT', 'General Awareness'],
    image:
      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    name: 'Ms. Priya Kumari',
    designation: 'English & GK Faculty',
    expertise: ['English', 'Current Affairs'],
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '5',
    name: 'Sub. (Retd.) Vikas Yadav',
    designation: 'Physical Training Instructor',
    expertise: ['Physical Fitness', 'Agniveer Prep'],
    image:
      'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '6',
    name: 'Mr. Alok Ranjan',
    designation: 'Reasoning & Science Faculty',
    expertise: ['Reasoning', 'General Science'],
    image:
      'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=400&q=80',
  },
];

export const galleryImages: { id: string; src: string; caption: string; category: string }[] = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    caption: 'Classroom Session',
    category: 'Campus',
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
    caption: 'Group Discussion',
    category: 'SSB',
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
    caption: 'Physical Training Ground',
    category: 'Training',
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=800&q=80',
    caption: 'Library',
    category: 'Campus',
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?auto=format&fit=crop&w=800&q=80',
    caption: 'Award Ceremony',
    category: 'Events',
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    caption: 'Seminar Hall',
    category: 'Campus',
  },
  {
    id: '7',
    src: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=800&q=80',
    caption: 'Digital Classroom',
    category: 'Campus',
  },
  {
    id: '8',
    src: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80',
    caption: 'Convocation',
    category: 'Events',
  },
];
