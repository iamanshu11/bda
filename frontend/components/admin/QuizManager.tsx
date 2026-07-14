'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

type Opt = 'A' | 'B' | 'C' | 'D';

interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: Opt;
  explanation?: string | null;
}

interface ModuleDetail {
  id: string;
  quiz: { id: string; passingMarks: number; questions: Question[] } | null;
}

const inputCls =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500';

const emptyForm = {
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A' as Opt,
  explanation: '',
};

export function QuizManager({ moduleId }: { moduleId: string }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [passing, setPassing] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-module', moduleId],
    queryFn: async () => {
      const res = await api.get(`/admin/modules/${moduleId}`);
      const mod = res.data.data as ModuleDetail;
      if (mod.quiz && passing === '') setPassing(mod.quiz.passingMarks);
      return mod;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-module', moduleId] });

  const saveConfig = useMutation({
    mutationFn: () => api.put(`/admin/modules/${moduleId}/quiz`, { passingMarks: Number(passing) || 1 }),
    onSuccess: invalidate,
  });

  const saveQuestion = useMutation({
    mutationFn: () =>
      editingId
        ? api.patch(`/admin/questions/${editingId}`, form)
        : api.post(`/admin/modules/${moduleId}/questions`, form),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/questions/${id}`),
    onSuccess: invalidate,
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }
  function openEdit(q: Question) {
    setEditingId(q.id);
    setForm({
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  const questions = data?.quiz?.questions ?? [];

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Pass mark:</span>
          <input
            type="number"
            value={passing}
            min={1}
            onChange={(e) => setPassing(e.target.value === '' ? '' : Number(e.target.value))}
            className="min-h-10 w-16 rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <span className="text-muted">/ {questions.length} questions</span>
          <Button size="sm" variant="outline" onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
            {saveConfig.isPending ? <Loader2 className="shrink-0 animate-spin" size={14} /> : 'Save'}
          </Button>
        </div>
        <Button size="sm" className="w-full sm:w-auto" onClick={openAdd}>
          <Plus size={15} className="shrink-0" /> Add question
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-navy-500" /></div>
      ) : questions.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No questions yet.</p>
      ) : (
        <ol className="space-y-2">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {i + 1}. {q.question}
                </p>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(q)} className="rounded p-1 text-navy-600 hover:bg-surface-alt"><Pencil size={14} /></button>
                  <button onClick={() => { if (confirm('Delete question?')) deleteQuestion.mutate(q.id); }} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {(['A', 'B', 'C', 'D'] as Opt[]).map((opt) => (
                  <span
                    key={opt}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1',
                      q.correctOption === opt ? 'bg-green-50 font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'text-muted',
                    )}
                  >
                    {q.correctOption === opt && <Check size={12} />} {opt}. {q[`option${opt}` as keyof Question] as string}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit question' : 'Add question'}>
        <form
          onSubmit={(e) => { e.preventDefault(); setError(null); saveQuestion.mutate(); }}
          className="space-y-3"
        >
          <textarea
            placeholder="Question"
            value={form.question}
            onChange={(e) => setForm((s) => ({ ...s, question: e.target.value }))}
            className={inputCls}
            rows={2}
            required
          />
          {(['A', 'B', 'C', 'D'] as Opt[]).map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={form.correctOption === opt}
                onChange={() => setForm((s) => ({ ...s, correctOption: opt }))}
                title="Mark as correct"
              />
              <input
                placeholder={`Option ${opt}`}
                value={form[`option${opt}` as 'optionA']}
                onChange={(e) => setForm((s) => ({ ...s, [`option${opt}`]: e.target.value }))}
                className={inputCls}
                required
              />
            </div>
          ))}
          <input
            placeholder="Explanation (optional)"
            value={form.explanation}
            onChange={(e) => setForm((s) => ({ ...s, explanation: e.target.value }))}
            className={inputCls}
          />
          <p className="text-xs text-muted">Select the radio next to the correct option.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveQuestion.isPending}>
              {saveQuestion.isPending ? <><Loader2 className="animate-spin" size={15} /> Saving…</> : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
