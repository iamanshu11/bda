'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, FileDown, Loader2, Lock, PlayCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getYouTubeEmbedUrl } from '@/lib/youtube';
import { QuizTaker } from './QuizTaker';
import { XpToast, type GamificationPayload } from '@/components/gamification/XpToast';

type ModuleStatus = 'locked' | 'in_progress' | 'completed';

interface LearnModule {
  id: string;
  moduleNumber: number;
  title: string;
  status: ModuleStatus;
  unlocked: boolean;
}
interface LearnData {
  course: { id: string; title: string; slug: string };
  totalModules: number;
  completedModules: number;
  percentage: number;
  resumeModuleId: string | null;
  modules: LearnModule[];
}

interface Opt { A: string; B: string; C: string; D: string }
interface ModuleDetail {
  id: string;
  moduleNumber: number;
  title: string;
  description?: string | null;
  youtubeUrl?: string | null;
  youtubeIframe?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
  quiz: { id: string; passingMarks: number; totalQuestions: number; questions: { id: string; question: string; options: Opt }[] } | null;
  progress: { videoCompleted: boolean; notesCompleted: boolean; quizPassed: boolean; completed: boolean };
}

const statusIcon = {
  completed: <CheckCircle2 size={16} className="text-green-600" />,
  in_progress: <Circle size={16} className="text-rust-500" />,
  locked: <Lock size={16} className="text-muted" />,
};

export function LearningView({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<GamificationPayload | null>(null);

  const learnQuery = useQuery({
    queryKey: ['learn', courseId],
    queryFn: async () => (await api.get(`/students/courses/${courseId}/learn`)).data.data as LearnData,
  });

  // Default-select the resume module once loaded.
  useEffect(() => {
    if (!selectedId && learnQuery.data?.resumeModuleId) setSelectedId(learnQuery.data.resumeModuleId);
  }, [learnQuery.data, selectedId]);

  const moduleQuery = useQuery({
    queryKey: ['learn-module', selectedId],
    queryFn: async () => (await api.get(`/students/modules/${selectedId}`)).data.data as ModuleDetail,
    enabled: !!selectedId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['learn', courseId] });
    qc.invalidateQueries({ queryKey: ['learn-module', selectedId] });
  };

  const showReward = (res: { data?: { data?: { gamification?: GamificationPayload } } }) => {
    const g = res.data?.data?.gamification;
    if (g?.xpEarned || g?.levelUp || g?.newAchievements?.length) setXpToast(g);
    refresh();
    qc.invalidateQueries({ queryKey: ['command-center'] });
  };

  const markVideo = useMutation({
    mutationFn: () => api.post(`/students/modules/${selectedId}/video-complete`),
    onSuccess: showReward,
  });
  const markNotes = useMutation({
    mutationFn: () => api.post(`/students/modules/${selectedId}/notes-complete`),
    onSuccess: showReward,
  });

  function goToNext() {
    refresh();
    const mods = learnQuery.data?.modules ?? [];
    const idx = mods.findIndex((m) => m.id === selectedId);
    const next = mods[idx + 1];
    if (next) {
      // Give the unlock a moment to reflect, then move on.
      setTimeout(() => setSelectedId(next.id), 400);
    }
  }

  if (learnQuery.isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-navy-500" size={32} /></div>;
  }
  if (learnQuery.isError || !learnQuery.data) {
    return <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load this course. Make sure you are enrolled and the API is running.</p>;
  }

  const learn = learnQuery.data;
  const mod = moduleQuery.data;
  const videoEmbed = getYouTubeEmbedUrl(mod?.youtubeUrl);
  const quizLocked = !(mod?.progress.videoCompleted && mod?.progress.notesCompleted);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <XpToast reward={xpToast} onDone={() => setXpToast(null)} />
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Link href="/dashboard/courses" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={14} /> Training missions
        </Link>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="font-heading font-bold text-foreground">{learn.course.title}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted">
              <span>{learn.completedModules}/{learn.totalModules} operations</span>
              <span>{learn.percentage}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-alt">
              <div className="h-full rounded-full bg-rust-500 transition-all" style={{ width: `${learn.percentage}%` }} />
            </div>
          </div>
          <ol className="mt-4 max-h-[60vh] space-y-1 overflow-y-auto">
            {learn.modules.map((m) => {
              const active = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    disabled={!m.unlocked}
                    onClick={() => m.unlocked && setSelectedId(m.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                      active ? 'bg-navy-600 text-white' : m.unlocked ? 'text-foreground hover:bg-surface-alt' : 'cursor-not-allowed text-muted',
                    )}
                  >
                    <span className={active ? 'text-white' : ''}>{active ? <PlayCircle size={16} /> : statusIcon[m.status]}</span>
                    <span className="truncate">{m.moduleNumber}. {m.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>

      {/* Main content */}
      <div>
        {!selectedId ? (
          <p className="text-muted">Select an operation to begin.</p>
        ) : moduleQuery.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
        ) : moduleQuery.isError || !mod ? (
          <p className="rounded-lg border border-border bg-surface p-6 text-muted">This operation is locked. Complete the previous operation first.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-navy-500">Operation {mod.moduleNumber}</p>
              <h1 className="font-heading text-2xl font-bold text-foreground">{mod.title}</h1>
              {mod.description && <p className="mt-1 text-muted">{mod.description}</p>}
            </div>

            {/* Video */}
            {(videoEmbed || mod.youtubeIframe) && (
              <div className="space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black [&_iframe]:h-full [&_iframe]:w-full">
                  {videoEmbed ? (
                    <iframe src={videoEmbed} title={mod.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full" />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: mod.youtubeIframe ?? '' }} />
                  )}
                </div>
                <Button size="sm" variant={mod.progress.videoCompleted ? 'outline' : 'primary'} onClick={() => markVideo.mutate()} disabled={mod.progress.videoCompleted || markVideo.isPending}>
                  {mod.progress.videoCompleted ? <><CheckCircle2 size={16} /> Video watched</> : markVideo.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Mark video as watched'}
                </Button>
              </div>
            )}

            {/* Notes */}
            {mod.notes && (
              <div className="space-y-3">
                <h2 className="font-heading text-lg font-bold text-foreground">Reading Notes</h2>
                <div
                  className={cn(
                    'max-w-none rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground',
                    '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:font-semibold',
                    '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
                    '[&_a]:text-navy-600 [&_a]:underline [&_img]:my-2 [&_img]:max-h-72 [&_img]:rounded',
                    '[&_pre]:rounded [&_pre]:bg-surface-alt [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs',
                  )}
                  dangerouslySetInnerHTML={{ __html: mod.notes }}
                />
                <Button size="sm" variant={mod.progress.notesCompleted ? 'outline' : 'primary'} onClick={() => markNotes.mutate()} disabled={mod.progress.notesCompleted || markNotes.isPending}>
                  {mod.progress.notesCompleted ? <><CheckCircle2 size={16} /> Notes read</> : markNotes.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Mark notes as read'}
                </Button>
              </div>
            )}

            {/* PDF notes */}
            {mod.attachmentUrl && (
              <a
                href={mod.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-navy-600 hover:bg-surface-alt dark:text-navy-200"
              >
                <FileDown size={16} /> Download PDF notes
              </a>
            )}

            {/* Quiz */}
            {mod.quiz && mod.quiz.questions.length > 0 && (
              <QuizTaker
                moduleId={mod.id}
                quiz={mod.quiz}
                disabled={quizLocked}
                onPassed={goToNext}
                onReward={(g) => {
                  if (g?.xpEarned || g?.levelUp || g?.newAchievements?.length) setXpToast(g);
                  qc.invalidateQueries({ queryKey: ['command-center'] });
                }}
              />
            )}

            {mod.progress.completed && (
              <p className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
                <CheckCircle2 size={18} /> Operation completed. The next operation is unlocked.
              </p>
            )}

            {/* Prev / Next navigation */}
            {(() => {
              const list = learn.modules;
              const idx = list.findIndex((x) => x.id === mod.id);
              const prev = idx > 0 ? list[idx - 1] : null;
              const next = idx < list.length - 1 ? list[idx + 1] : null;
              return (
                <div className="flex items-center justify-between border-t border-border pt-5">
                  <Button variant="outline" size="sm" disabled={!prev} onClick={() => prev && setSelectedId(prev.id)}>
                    <ChevronLeft size={16} /> Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={!next || !next.unlocked} onClick={() => next && next.unlocked && setSelectedId(next.id)}>
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
