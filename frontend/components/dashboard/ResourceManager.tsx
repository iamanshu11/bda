'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { ImageUploadField } from './ImageUploadField';

export interface FieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'image' | 'datetime';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
}

export interface ColumnConfig<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface ResourceManagerProps {
  title: string;
  endpoint: string; // e.g. /admin/courses
  columns: ColumnConfig[];
  fields?: FieldConfig[]; // omit to make read-only
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

type Row = Record<string, unknown> & { id: string };

const inputCls =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500';

/**
 * Generic admin CRUD screen: search + paginated table + create/edit modal +
 * delete. Drives every admin resource from a small config — no duplicated code.
 */
export function ResourceManager({
  title,
  endpoint,
  columns,
  fields,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}: ResourceManagerProps) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const limit = 10;
  const key = [endpoint, page, search];

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const res = await api.get(endpoint, { params: { page, limit, search: search || undefined } });
      return { items: res.data.data as Row[], meta: res.data.meta as { totalPages: number; total: number } };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editing) return api.patch(`${endpoint}/${editing.id}`, payload);
      return api.post(endpoint, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [endpoint] });
      closeModal();
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [endpoint] }),
  });

  function openCreate() {
    setEditing(null);
    const initial: Record<string, unknown> = {};
    fields?.forEach((f) => {
      if (f.defaultValue !== undefined) initial[f.name] = f.defaultValue;
      else if (f.type === 'checkbox') initial[f.name] = false;
    });
    setForm(initial);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    const initial: Record<string, unknown> = {};
    fields?.forEach((f) => {
      initial[f.name] = row[f.name] ?? (f.type === 'checkbox' ? false : '');
    });
    setForm(initial);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    // Drop empty strings so optional fields aren't sent as ""
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v !== '' && v !== undefined) payload[k] = v;
    }
    saveMutation.mutate(payload);
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="min-w-0 truncate font-heading text-xl font-bold text-foreground sm:text-2xl">
          {title}
        </h2>
        {fields && canCreate && (
          <Button onClick={openCreate} size="sm" className="w-full shrink-0 sm:w-auto">
            <Plus size={16} className="shrink-0" /> New
          </Button>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search…"
          className={cn(inputCls, 'min-h-10 pl-9')}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">{c.label}</th>
              ))}
              {(canEdit || canDelete) && fields && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center"><Loader2 className="mx-auto animate-spin text-navy-500" /></td></tr>
            ) : isError ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted">Could not load data. Is the API running?</td></tr>
            ) : data!.items.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted">No records found.</td></tr>
            ) : (
              data!.items.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-foreground">
                      {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                    </td>
                  ))}
                  {(canEdit || canDelete) && fields && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <button onClick={() => openEdit(row)} className="rounded p-1.5 text-navy-600 hover:bg-surface-alt" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this record?')) deleteMutation.mutate(row.id);
                            }}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted">
            Page {page} of {data.meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {fields && (
        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={`${editing ? 'Edit' : 'New'} ${title.replace(/s$/, '')}`}
          size={fields.length > 6 ? 'lg' : 'md'}
        >
          <form onSubmit={submit} className="space-y-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={String(form[f.name] ?? '')}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                ) : f.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(form[f.name])}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))}
                  />
                ) : f.type === 'select' ? (
                  <select
                    className={inputCls}
                    value={String(form[f.name] ?? '')}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'image' ? (
                  <ImageUploadField
                    value={String(form[f.name] ?? '')}
                    onChange={(url) => setForm((s) => ({ ...s, [f.name]: url }))}
                  />
                ) : f.type === 'datetime' ? (
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={String(form[f.name] ?? '').slice(0, 16)}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    placeholder={f.placeholder}
                    className={inputCls}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={String(form[f.name] ?? '')}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        [f.name]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="shrink-0 animate-spin" size={16} /> Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
