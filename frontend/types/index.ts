import type { LucideIcon } from 'lucide-react';

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

export interface ExamCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  accent: 'navy' | 'olive' | 'rust';
}

export interface Course {
  id: string;
  title: string;
  badge: string;
  badgeType: 'foundation' | 'guarantee';
  description: string;
  href: string;
}

export interface Achiever {
  id: string;
  name: string;
  rank: string;
  exam: string;
  image: string;
}

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  accent: 'navy' | 'rust' | 'olive';
}

export interface Facility {
  id: string;
  title: string;
  icon: LucideIcon;
}

/** Generic API envelope — mirrors the backend's generic response shape. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
