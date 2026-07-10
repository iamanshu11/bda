'use client';

import { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Code2,
  Eraser,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Lightweight rich-text editor (contentEditable + execCommand). Dependency-free.
 * Stores/returns HTML. Good enough for admin notes (bold, italic, headings,
 * lists, links, images, code). Content is rendered on the student side.
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Set initial content once (avoid resetting cursor on every keystroke).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML ?? '');
  }

  function handleInput() {
    onChange(ref.current?.innerHTML ?? '');
  }

  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded text-foreground hover:bg-surface-alt';

  const tools = [
    { icon: Bold, cmd: () => exec('bold'), label: 'Bold' },
    { icon: Italic, cmd: () => exec('italic'), label: 'Italic' },
    { icon: Underline, cmd: () => exec('underline'), label: 'Underline' },
    { icon: Heading2, cmd: () => exec('formatBlock', '<h2>'), label: 'Heading 2' },
    { icon: Heading3, cmd: () => exec('formatBlock', '<h3>'), label: 'Heading 3' },
    { icon: List, cmd: () => exec('insertUnorderedList'), label: 'Bullet list' },
    { icon: ListOrdered, cmd: () => exec('insertOrderedList'), label: 'Numbered list' },
    { icon: Code2, cmd: () => exec('formatBlock', '<pre>'), label: 'Code block' },
    {
      icon: Link2,
      cmd: () => {
        const url = window.prompt('Link URL');
        if (url) exec('createLink', url);
      },
      label: 'Link',
    },
    {
      icon: ImageIcon,
      cmd: () => {
        const url = window.prompt('Image URL');
        if (url) exec('insertImage', url);
      },
      label: 'Image',
    },
    { icon: Eraser, cmd: () => exec('removeFormat'), label: 'Clear formatting' },
  ];

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-alt p-1">
        {tools.map((t, i) => {
          const Icon = t.icon;
          return (
            <button key={i} type="button" onClick={t.cmd} title={t.label} className={btn}>
              <Icon size={16} />
            </button>
          );
        })}
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        className={cn(
          'prose-editor min-h-[180px] max-w-none overflow-y-auto p-3 text-sm text-foreground focus:outline-none',
          '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold',
          '[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_a]:text-navy-600 [&_a]:underline',
          '[&_pre]:rounded [&_pre]:bg-surface-alt [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs',
          '[&_img]:my-2 [&_img]:max-h-64 [&_img]:rounded',
        )}
        suppressContentEditableWarning
      />
    </div>
  );
}
