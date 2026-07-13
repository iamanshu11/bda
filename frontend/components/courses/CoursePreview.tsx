import { PlayCircle } from 'lucide-react';
import { getYouTubeEmbedUrl } from '@/lib/youtube';
import { cn } from '@/lib/utils';
import type { ApiPreviewModule } from '@/types/api';

/** Free pre-purchase preview: sample video, notes and demo quiz (no answers). */
export function CoursePreview({ modules }: { modules: ApiPreviewModule[] }) {
  if (!modules || modules.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <PlayCircle size={20} className="text-rust-500" />
        <h2 className="font-heading text-xl font-bold text-foreground">Free Preview</h2>
      </div>
      <p className="mt-1 text-sm text-muted">A taste of what&apos;s inside — no enrollment required.</p>

      <div className="mt-4 space-y-6">
        {modules.map((m) => {
          const embed = getYouTubeEmbedUrl(m.youtubeUrl);
          return (
            <div key={m.id} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-xs font-medium text-navy-500">Operation {m.moduleNumber}</p>
              <h3 className="font-heading text-lg font-bold text-foreground">{m.title}</h3>

              {(embed || m.youtubeIframe) && (
                <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg bg-black [&_iframe]:h-full [&_iframe]:w-full">
                  {embed ? (
                    <iframe src={embed} title={m.title} allowFullScreen className="h-full w-full" />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: m.youtubeIframe ?? '' }} />
                  )}
                </div>
              )}

              {m.notes && (
                <div
                  className={cn(
                    'mt-4 max-w-none text-sm leading-relaxed text-foreground',
                    '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5',
                    '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-navy-600 [&_a]:underline',
                  )}
                  dangerouslySetInnerHTML={{ __html: m.notes }}
                />
              )}

              {m.quiz && m.quiz.questions.length > 0 && (
                <div className="mt-4 rounded-lg border border-dashed border-border p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Sample quiz</p>
                  <ol className="space-y-3">
                    {m.quiz.questions.slice(0, 3).map((q, i) => (
                      <li key={q.id}>
                        <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                        <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted">
                          <span>A. {q.optionA}</span>
                          <span>B. {q.optionB}</span>
                          <span>C. {q.optionC}</span>
                          <span>D. {q.optionD}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-xs text-muted">Enroll to attempt the full assessment.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
