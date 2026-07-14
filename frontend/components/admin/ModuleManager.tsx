'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, ListChecks, Loader2, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from './RichTextEditor';
import { QuizManager } from './QuizManager';
import { FileUploadField } from './FileUploadField';
import { getApiErrorMessage } from '@/lib/errors';

interface ModuleRow {
  id: string;
  moduleNumber: number;
  title: string;
  description?: string | null;
  estimatedDuration?: string | null;
  youtubeUrl?: string | null;
  youtubeIframe?: string | null;
  notes?: string | null;
  attachmentUrl?: string | null;
  isPreview?: boolean;
  quiz?: { _count?: { questions: number } } | null;
}

const inputCls =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500';

const emptyForm = {
  title: '',
  description: '',
  estimatedDuration: '',
  youtubeUrl: '',
  youtubeIframe: '',
  notes: '',
  attachmentUrl: '',
  isPreview: false,
};

export function ModuleManager({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const key = ['admin-modules', courseId];
  const { data: modules, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get(`/admin/courses/${courseId}/modules`)).data.data as ModuleRow[],
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const save = useMutation({
    mutationFn: () =>
      editingId
        ? api.patch(`/admin/modules/${editingId}`, form)
        : api.post(`/admin/courses/${courseId}/modules`, form),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/modules/${id}`),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => api.post(`/admin/courses/${courseId}/modules/reorder`, { orderedIds }),
    onSuccess: invalidate,
  });

  function move(index: number, dir: -1 | 1) {
    if (!modules) return;
    const next = [...modules];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((m) => m.id));
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }
  function openEdit(m: ModuleRow) {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description ?? '',
      estimatedDuration: m.estimatedDuration ?? '',
      youtubeUrl: m.youtubeUrl ?? '',
      youtubeIframe: m.youtubeIframe ?? '',
      notes: m.notes ?? '',
      attachmentUrl: m.attachmentUrl ?? '',
      isPreview: Boolean(m.isPreview),
    });
    setError(null);
    setModalOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/courses" className="mb-1 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
            <ArrowLeft size={14} className="shrink-0" /> Back to courses
          </Link>
          <h2 className="truncate font-heading text-xl font-bold text-foreground sm:text-2xl">Course Modules</h2>
        </div>
        <Button onClick={openAdd} size="sm" className="w-full shrink-0 sm:w-auto">
          <Plus size={16} className="shrink-0" /> Add module
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : isError ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load modules.</p>
      ) : !modules || modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted">No modules yet. Add the first module to build this course.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {modules.map((m, i) => (
            <li key={m.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-600 text-sm font-bold text-white">
                  {m.moduleNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{m.title}</p>
                  <p className="flex items-center gap-3 text-xs text-muted">
                    {m.estimatedDuration && <span>{m.estimatedDuration}</span>}
                    {(m.youtubeUrl || m.youtubeIframe) && <span className="inline-flex items-center gap-1"><Video size={12} /> Video</span>}
                    <span className="inline-flex items-center gap-1"><ListChecks size={12} /> {m.quiz?._count?.questions ?? 0} Qs</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-muted hover:bg-surface-alt disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === modules.length - 1} className="rounded p-1.5 text-muted hover:bg-surface-alt disabled:opacity-30"><ChevronDown size={16} /></button>
                  <button onClick={() => openEdit(m)} className="rounded p-1.5 text-navy-600 hover:bg-surface-alt"><Pencil size={16} /></button>
                  <button onClick={() => { if (confirm('Delete this module?')) remove.mutate(m.id); }} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                  <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                    Quiz
                  </Button>
                </div>
              </div>
              {expanded === m.id && <QuizManager moduleId={m.id} />}
            </li>
          ))}
        </ol>
      )}

      {/* Module create/edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit module' : 'Add module'}>
        <form onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(); }} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
            <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Duration</label>
              <input value={form.estimatedDuration} onChange={(e) => setForm((s) => ({ ...s, estimatedDuration: e.target.value }))} placeholder="e.g. 25 min" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Short description</label>
            <input value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">YouTube URL</label>
            <input value={form.youtubeUrl} onChange={(e) => setForm((s) => ({ ...s, youtubeUrl: e.target.value }))} placeholder="https://www.youtube.com/watch?v=…" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">…or YouTube embed iframe</label>
            <textarea value={form.youtubeIframe} onChange={(e) => setForm((s) => ({ ...s, youtubeIframe: e.target.value }))} placeholder="<iframe …></iframe>" className={inputCls} rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Reading notes</label>
            <RichTextEditor value={form.notes} onChange={(html) => setForm((s) => ({ ...s, notes: html }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">PDF notes (optional)</label>
            <FileUploadField value={form.attachmentUrl} onChange={(url) => setForm((s) => ({ ...s, attachmentUrl: url }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.isPreview}
              onChange={(e) => setForm((s) => ({ ...s, isPreview: e.target.checked }))}
            />
            Free preview (visible before purchase)
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <><Loader2 className="animate-spin" size={15} /> Saving…</> : 'Save module'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
