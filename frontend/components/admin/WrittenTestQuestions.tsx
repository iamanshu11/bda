'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/lib/errors';

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
  marks: number;
}

interface TestMeta {
  marksPerQuestion: number;
  negativeMark: number;
}

const inputCls =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500';

function emptyForm(defaultMarks: number) {
  return {
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A' as Opt,
    explanation: '',
    marks: defaultMarks,
  };
}

export function WrittenTestQuestions({ testId, onClose }: { testId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(1));
  const [error, setError] = useState<string | null>(null);

  const { data: testMeta } = useQuery({
    queryKey: ['admin-written-test', testId],
    queryFn: async () => (await api.get(`/admin/written-tests/${testId}`)).data.data as TestMeta,
  });

  const defaultMarks = testMeta?.marksPerQuestion ?? 1;
  const negativeMark = testMeta?.negativeMark ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-test-questions', testId],
    queryFn: async () => (await api.get(`/admin/written-tests/${testId}/questions`)).data.data as Question[],
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-test-questions', testId] });

  const saveQuestion = useMutation({
    mutationFn: () =>
      editingId
        ? api.patch(`/admin/test-questions/${editingId}`, form)
        : api.post(`/admin/written-tests/${testId}/questions`, form),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm(defaultMarks));
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/test-questions/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-foreground">Test questions</h3>
          <p className="mt-1 text-xs text-muted">
            Default: +{defaultMarks} correct · −{negativeMark} wrong (from test settings; overridable per
            question)
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm(defaultMarks));
              setModalOpen(true);
            }}
          >
            <Plus size={16} className="shrink-0" /> Add
          </Button>
          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            <X size={16} className="shrink-0" /> Close
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-navy-500" />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((q, i) => (
            <li key={q.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {i + 1}. {q.question}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Correct: {q.correctOption} · +{q.marks} / −{negativeMark}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded p-1.5 text-muted hover:bg-surface-alt hover:text-foreground"
                  onClick={() => {
                    setEditingId(q.id);
                    setForm({
                      question: q.question,
                      optionA: q.optionA,
                      optionB: q.optionB,
                      optionC: q.optionC,
                      optionD: q.optionD,
                      correctOption: q.correctOption,
                      explanation: q.explanation ?? '',
                      marks: q.marks,
                    });
                    setModalOpen(true);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                  onClick={() => remove.mutate(q.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit question' : 'Add question'}
      >
        <div className="space-y-3">
          <textarea
            className={inputCls}
            rows={2}
            placeholder="Question"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          />
          {(['A', 'B', 'C', 'D'] as Opt[]).map((opt) => (
            <input
              key={opt}
              className={inputCls}
              placeholder={`Option ${opt}`}
              value={form[`option${opt}` as 'optionA']}
              onChange={(e) => setForm((f) => ({ ...f, [`option${opt}`]: e.target.value }))}
            />
          ))}
          <select
            className={inputCls}
            value={form.correctOption}
            onChange={(e) => setForm((f) => ({ ...f, correctOption: e.target.value as Opt }))}
          >
            {(['A', 'B', 'C', 'D'] as Opt[]).map((o) => (
              <option key={o} value={o}>
                Correct: {o}
              </option>
            ))}
          </select>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Marks if correct (default {defaultMarks})
            </label>
            <input
              className={inputCls}
              type="number"
              step="any"
              min={0.01}
              placeholder={String(defaultMarks)}
              value={form.marks}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  marks: e.target.value === '' ? defaultMarks : Number(e.target.value),
                }))
              }
            />
            <p className="mt-1 text-xs text-muted">
              Wrong answers deduct {negativeMark} from the test negative-mark setting.
            </p>
          </div>
          <textarea
            className={inputCls}
            rows={2}
            placeholder="Explanation (optional)"
            value={form.explanation}
            onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            onClick={() => {
              setError(null);
              saveQuestion.mutate();
            }}
            disabled={saveQuestion.isPending}
          >
            {saveQuestion.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
