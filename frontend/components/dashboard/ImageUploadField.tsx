'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { getApiErrorMessage } from '@/lib/errors';

const inputCls =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500';

/**
 * Image field for admin forms: upload a file (stored via the backend) or paste
 * a URL. Shows a live preview. The resolved URL is what gets saved.
 */
export function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
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
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-alt">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={22} className="text-muted" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-alt disabled:opacity-60"
          >
            {uploading ? <><Loader2 className="animate-spin" size={15} /> Uploading…</> : <><ImagePlus size={15} /> Upload image</>}
          </button>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className={inputCls}
          />
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
