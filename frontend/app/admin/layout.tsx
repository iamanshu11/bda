'use client';

import {
  BadgeIndianRupee,
  BarChart3,
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
  Star,
  Ticket,
  Trophy,
  Users,
  UserSquare2,
  ClipboardList,
  ShieldAlert,
  ScrollText,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/DashboardShell';

const nav: DashboardNavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Courses', href: '/admin/courses', icon: BookOpen },
  { label: 'Written Tests', href: '/admin/written-tests', icon: ClipboardList },
  { label: 'Exam Monitoring', href: '/admin/exam-monitoring', icon: ShieldAlert },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Faculty', href: '/admin/faculty', icon: UserSquare2 },
  { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
  { label: 'Results', href: '/admin/results', icon: Trophy },
  { label: 'Live Classes', href: '/admin/live-classes', icon: CalendarClock },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { label: 'Payments', href: '/admin/payments', icon: BadgeIndianRupee },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
  { label: 'Blogs', href: '/admin/blogs', icon: Newspaper },
  { label: 'Study Materials', href: '/admin/study-materials', icon: FileText },
  { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Audit Log', href: '/admin/audit-logs', icon: ScrollText },
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
