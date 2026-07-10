'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { getApiErrorMessage } from '@/lib/errors';

const inputCls =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500';

/** Upload any file (e.g. PDF) or paste a URL. Returns the resolved URL. */
export function FileUploadField({
  value,
  onChange,
  accept = 'application/pdf',
}: {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadFile(file));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-alt disabled:opacity-60"
        >
          {uploading ? <><Loader2 className="animate-spin" size={15} /> Uploading…</> : <><Upload size={15} /> Upload PDF</>}
        </button>
        {value && (
          <span className="inline-flex items-center gap-1 text-sm text-foreground">
            <FileText size={15} className="text-rust-500" /> Attached
            <button type="button" onClick={() => onChange('')} aria-label="Remove"><X size={14} className="text-muted hover:text-red-600" /></button>
          </span>
        )}
      </div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste a PDF URL" className={inputCls} />
      <input ref={fileRef} type="file" accept={accept} hidden onChange={handleFile} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
