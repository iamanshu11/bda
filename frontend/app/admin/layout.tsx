'use client';

import {
  BookOpen,
  CalendarClock,
  FileText,
  FolderTree,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Newspaper,
  Trophy,
  Users,
  UserSquare2,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/DashboardShell';

const nav: DashboardNavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Faculty', href: '/admin/faculty', icon: UserSquare2 },
  { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
  { label: 'Results', href: '/admin/results', icon: Trophy },
  { label: 'Live Classes', href: '/admin/live-classes', icon: CalendarClock },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
  { label: 'Blogs', href: '/admin/blogs', icon: Newspaper },
  { label: 'Study Materials', href: '/admin/study-materials', icon: FileText },
  { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={['ADMIN', 'SUPER_ADMIN']}>
      <DashboardShell nav={nav} title="Admin Dashboard">
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
