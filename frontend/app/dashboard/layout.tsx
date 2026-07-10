'use client';

import { BookOpen, BarChart3, LayoutDashboard, Swords, Trophy, UserCog } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardShell, type DashboardNavItem } from '@/components/dashboard/DashboardShell';

const nav: DashboardNavItem[] = [
  { label: 'Command Center', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Training Missions', href: '/dashboard/courses', icon: BookOpen },
  { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  { label: 'Rankings', href: '/dashboard/rankings', icon: BarChart3 },
  { label: 'Quiz Battles', href: '/dashboard/battles', icon: Swords },
  { label: 'Cadet Profile', href: '/dashboard/profile', icon: UserCog },
];

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={['STUDENT', 'FACULTY']}>
      <DashboardShell nav={nav} title="Cadet Command Center">
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
