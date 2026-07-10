'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Award, CalendarClock, Flame, Loader2, Medal, Play, Sparkles, Trophy, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { XpToast, type GamificationPayload } from '@/components/gamification/XpToast';

interface Mission { courseId: string; title: string; total: number; completed: number; percentage: number }
interface LiveClass { id: string; title: string; scheduledAt: string; meetingUrl?: string | null; course?: { title: string } | null }
interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
}
interface CommandCenter {
  missionProgress: { overallPercentage: number; completedModules: number; totalModules: number; missions: Mission[] };
  currentOperation: null | { courseId: string; courseTitle: string; moduleId: string; moduleTitle: string; moduleNumber: number };
  weeklyPerformance: { modulesCompleted: number; quizzesTaken: number; avgScore: number; dailyActivity: { day: string; date: string; count: number }[] };
  studyStreak: { current: number; longest: number; todayDone: boolean };
  cadetRank: { name: string; tier: number; next: number | null; progressToNext: number };
  gamification: null | {
    totalXp: number;
    level: { name: string; tier: number; progressToNext: number; next: number | null };
    achievements: Achievement[];
    recentXp: { action: string; amount: number; at: string }[];
  };
  todaysBriefing: { classes: LiveClass[] };
  announcements: { id: string; title: string; body: string; pinned: boolean; createdAt: string }[];
}

function Card({ title, icon, children, className = '' }: { title: string; icon: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      <h3 className="mb-4 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-navy-600 dark:text-navy-200">
        <span aria-hidden>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CadetCommandCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [xpToast, setXpToast] = useState<GamificationPayload | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['command-center'],
    queryFn: async () => (await api.get('/students/command-center')).data.data as CommandCenter,
  });

  const attendClass = useMutation({
    mutationFn: (classId: string) => api.post(`/students/live-classes/${classId}/attend`),
    onSuccess: (res) => {
      setXpToast(res.data.data);
      qc.invalidateQueries({ queryKey: ['command-center'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-navy-800 p-6 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 to-navy-700/50" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-widest text-rust-300">Cadet Command Center</p>
          <h2 className="mt-1 font-heading text-2xl font-extrabold">
            At ease, Cadet {user?.name?.split(' ')[0] ?? ''}
          </h2>
          <p className="mt-1 text-sm text-navy-100/80">Your mission status and orders for today.</p>
          {data?.gamification && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
              <Sparkles size={14} className="text-rust-300" />
              {data.gamification.totalXp} XP · Level {data.gamification.level.tier} — {data.gamification.level.name}
            </p>
          )}
        </div>
      </div>

      <XpToast reward={xpToast} onDone={() => setXpToast(null)} />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : isError || !data ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-muted">
          Could not load your command center. Please refresh the page or try again in a moment.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Mission Progress */}
          <Card title="Mission Progress" icon="🎯">
            <div className="flex items-center gap-5">
              <ProgressRing value={data.missionProgress.overallPercentage}>
                <span className="font-heading text-xl font-extrabold text-foreground">{data.missionProgress.overallPercentage}%</span>
                <span className="text-[10px] text-muted">complete</span>
              </ProgressRing>
              <div className="text-sm">
                <p className="text-foreground"><span className="font-bold">{data.missionProgress.completedModules}</span> / {data.missionProgress.totalModules} operations</p>
                <p className="mt-1 text-muted">{data.missionProgress.missions.length} training missions</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {data.missionProgress.missions.slice(0, 3).map((m) => (
                <div key={m.courseId}>
                  <div className="flex justify-between text-xs">
                    <span className="truncate text-foreground">{m.title}</span>
                    <span className="text-muted">{m.percentage}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                    <div className="h-full rounded-full bg-navy-500" style={{ width: `${m.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Current Operation */}
          <Card title="Current Operation" icon="📚">
            {data.currentOperation ? (
              <div className="flex h-full flex-col">
                <p className="text-xs text-muted">{data.currentOperation.courseTitle}</p>
                <p className="mt-1 font-heading text-lg font-bold text-foreground">
                  Op {data.currentOperation.moduleNumber}: {data.currentOperation.moduleTitle}
                </p>
                <div className="mt-auto pt-4">
                  <Button href={`/dashboard/learn/${data.currentOperation.courseId}`} className="w-full">
                    <Play size={16} /> Resume Operation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-muted">
                No active operation.{' '}
                <Link href="/courses" className="font-semibold text-navy-600 hover:underline dark:text-navy-200">Enlist in a mission</Link>.
              </div>
            )}
          </Card>

          {/* Cadet Rank (XP-based) */}
          <Card title="Cadet Rank" icon="🏅">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rust-400 to-rust-600 text-white">
                <Medal size={26} />
              </span>
              <div>
                <p className="font-heading text-lg font-extrabold text-foreground">{data.cadetRank.name}</p>
                <p className="text-xs text-muted">
                  Tier {data.cadetRank.tier}
                  {data.gamification ? ` · ${data.gamification.totalXp} XP` : ''}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted">
                <span>Progress to next rank</span>
                <span>{data.cadetRank.next === null ? 'MAX' : `${data.cadetRank.progressToNext}%`}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-rust-500" style={{ width: `${data.cadetRank.progressToNext}%` }} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-md bg-surface-alt p-2"><span className="font-bold text-foreground">+10</span> video</div>
              <div className="rounded-md bg-surface-alt p-2"><span className="font-bold text-foreground">+5</span> notes</div>
              <div className="rounded-md bg-surface-alt p-2"><span className="font-bold text-foreground">+20</span> quiz</div>
              <div className="rounded-md bg-surface-alt p-2"><span className="font-bold text-foreground">+100</span> course</div>
            </div>
          </Card>

          {/* Study Streak */}
          <Card title="Study Streak" icon="🔥">
            <div className="flex items-center gap-4">
              <span className={`flex h-14 w-14 items-center justify-center rounded-full ${data.studyStreak.current > 0 ? 'bg-rust-50 text-rust-500 dark:bg-rust-900/40' : 'bg-surface-alt text-muted'}`}>
                <Flame size={28} />
              </span>
              <div>
                <p className="font-heading text-2xl font-extrabold text-foreground">{data.studyStreak.current} <span className="text-sm font-medium text-muted">day{data.studyStreak.current === 1 ? '' : 's'}</span></p>
                <p className="text-xs text-muted">Longest: {data.studyStreak.longest} days</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              {data.studyStreak.todayDone ? 'Reported for duty today ✅' : 'Complete an operation today to keep your streak.'}
            </p>
          </Card>

          {/* Weekly Performance */}
          <Card title="Weekly Performance" icon="📈">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="font-heading text-xl font-extrabold text-foreground">{data.weeklyPerformance.modulesCompleted}</p><p className="text-[11px] text-muted">Ops done</p></div>
              <div><p className="font-heading text-xl font-extrabold text-foreground">{data.weeklyPerformance.quizzesTaken}</p><p className="text-[11px] text-muted">Assessments</p></div>
              <div><p className="font-heading text-xl font-extrabold text-foreground">{data.weeklyPerformance.avgScore}</p><p className="text-[11px] text-muted">Avg score</p></div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-1" style={{ height: 60 }}>
              {data.weeklyPerformance.dailyActivity.map((d, i) => {
                const max = Math.max(1, ...data.weeklyPerformance.dailyActivity.map((x) => x.count));
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t bg-navy-500" style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 2, opacity: d.count ? 1 : 0.25 }} />
                    </div>
                    <span className="text-[10px] text-muted">{d.day[0]}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Today's Briefing */}
          <Card title="Today's Briefing" icon="📅">
            {data.todaysBriefing.classes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No live classes scheduled. Focus on your operations.</p>
            ) : (
              <ul className="space-y-3">
                {data.todaysBriefing.classes.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted"><CalendarClock size={11} className="mr-1 inline" />{fmtTime(c.scheduledAt)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={attendClass.isPending}
                        onClick={() => attendClass.mutate(c.id)}
                        className="text-xs"
                      >
                        {attendClass.isPending ? <Loader2 className="animate-spin" size={11} /> : '+25 XP'}
                      </Button>
                      {c.meetingUrl && (
                        <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-rust-500 px-2 py-1 text-xs font-semibold text-white hover:bg-rust-600">
                          <Video size={11} /> Join
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Achievements */}
          {data.gamification && (
            <Card title="Achievements" icon="🏆" className="lg:col-span-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.gamification.achievements.map((a) => (
                  <div
                    key={a.code}
                    className={`rounded-lg border p-3 ${a.earned ? 'border-rust-200 bg-rust-50/50 dark:border-rust-800 dark:bg-rust-950/20' : 'border-border opacity-60'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className={a.earned ? 'text-rust-500' : 'text-muted'} />
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted">{a.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Command Announcements */}
          <Card title="Command Announcements" icon="📢" className="lg:col-span-3">
            {data.announcements.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No announcements from command right now.</p>
            ) : (
              <ul className="space-y-3">
                {data.announcements.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Award size={14} className="text-rust-500" />}
                      <p className="font-semibold text-foreground">{a.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted">{a.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
