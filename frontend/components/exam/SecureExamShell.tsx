'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type ViolationType =
  | 'WINDOW_MINIMIZED'
  | 'TAB_HIDDEN'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'PAGE_REFRESH'
  | 'DEVTOOLS'
  | 'CLIPBOARD'
  | 'RIGHT_CLICK'
  | 'SHORTCUT'
  | 'MULTI_TAB'
  | 'MULTI_DEVICE'
  | 'OFFLINE';

interface SecureExamShellProps {
  children: React.ReactNode;
  enabled: boolean;
  onViolation: (type: ViolationType, metadata?: Record<string, unknown>) => void;
  cheatingCount: number;
  maxCheatingAttempts: number;
  warning: string | null;
  onDismissWarning: () => void;
}

function requestFs(el: HTMLElement) {
  const req =
    el.requestFullscreen ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).webkitRequestFullscreen ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).msRequestFullscreen;
  if (req) return req.call(el);
  return Promise.resolve();
}

// One unique id per browser tab (survives StrictMode remounts within the tab).
const TAB_ID = Math.random().toString(36).slice(2);

/**
 * Best-effort secure exam wrappers. Browsers cannot block all cheating
 * (Alt+Tab, second monitors, phones) — we detect and log what we can.
 *
 * Anti-cheat is deliberately LENIENT to avoid false auto-submits:
 * - A single "left the exam" action is counted ONCE (visibility change only —
 *   window blur alone is too noisy: it fires on the address bar, native
 *   selects, screenshots, notifications, etc.).
 * - Every violation type has a cooldown so rapid duplicates don't stack.
 * - Fullscreen is entered via a user gesture (the Start button / banner button),
 *   never auto-requested on mount (browsers reject that and it looks "stuck").
 */
export function SecureExamShell({
  children,
  enabled,
  onViolation,
  cheatingCount,
  maxCheatingAttempts,
  warning,
  onDismissWarning,
}: SecureExamShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [needsFs, setNeedsFs] = useState(false);

  // Per-type cooldown + global debounce so one action = one strike.
  const lastByType = useRef<Record<string, number>>({});
  const lastAny = useRef(0);

  const report = useCallback(
    (type: ViolationType, metadata?: Record<string, unknown>) => {
      if (!enabled) return;
      const nowTs = Date.now();
      if (nowTs - lastAny.current < 1200) return; // global debounce (dedupe bursts)
      if (nowTs - (lastByType.current[type] ?? 0) < 8000) return; // per-type cooldown
      lastByType.current[type] = nowTs;
      lastAny.current = nowTs;
      onViolation(type, metadata);
    },
    [enabled, onViolation],
  );

  // Multi-tab lock via BroadcastChannel — ignore our own echoes (StrictMode
  // mounts two channels in the SAME tab; both share TAB_ID, so no false MULTI_TAB).
  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel('bda-exam-lock');
    ch.onmessage = (ev) => {
      if (ev.data?.type === 'claim' && ev.data.tabId && ev.data.tabId !== TAB_ID) {
        report('MULTI_TAB');
      }
    };
    ch.postMessage({ type: 'claim', tabId: TAB_ID });
    return () => ch.close();
  }, [enabled, report]);

  // Real page-refresh detection via the Navigation Timing API (no StrictMode
  // false positives, unlike the old sessionStorage flag).
  useEffect(() => {
    if (!enabled) return;
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === 'reload') report('PAGE_REFRESH');
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Single "left the exam" signal. document.hidden is the reliable indicator
    // of a genuine tab switch / minimize — we do NOT also listen to window blur.
    const onVis = () => {
      if (document.hidden) report('TAB_HIDDEN');
    };
    const onFs = () => {
      setNeedsFs(!document.fullscreenElement);
      if (!document.fullscreenElement) report('FULLSCREEN_EXIT');
    };
    const onContext = (e: Event) => {
      e.preventDefault();
      report('RIGHT_CLICK');
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      report('CLIPBOARD', { action: e.type });
    };
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const blocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.ctrlKey && ['u', 'r', 'p', 's', 'w'].includes(key)) ||
        (e.metaKey && ['u', 'r', 'p', 's'].includes(key)) ||
        (e.ctrlKey && ['c', 'v', 'x'].includes(key));
      if (blocked) {
        e.preventDefault();
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey)) report('DEVTOOLS');
        else if (['c', 'v', 'x'].includes(key)) report('CLIPBOARD', { key });
        else report('SHORTCUT', { key: e.key });
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('paste', onCopy);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('beforeunload', onBeforeUnload);

    setNeedsFs(!document.fullscreenElement);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('paste', onCopy);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [enabled, report]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] overflow-y-auto select-none bg-background text-foreground"
      style={{ userSelect: 'none' }}
    >
      {needsFs && enabled && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-3 bg-rust-600 px-4 py-2 text-sm text-white">
          <Maximize2 size={16} />
          Full-screen recommended for this exam.
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-rust-700"
            onClick={() => rootRef.current && void requestFs(rootRef.current).catch(() => undefined)}
          >
            Enter full screen
          </Button>
        </div>
      )}

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-navy-900 px-4 py-2 text-white">
        <p className="text-sm font-semibold">Secure Exam Mode</p>
        <p className="text-sm">
          Warnings:{' '}
          <span className={cheatingCount > 0 ? 'font-bold text-rust-300' : 'font-bold'}>
            {cheatingCount} / {maxCheatingAttempts}
          </span>
        </p>
      </div>

      {warning && (
        <div className="fixed inset-0 z-[110] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-rust-300 bg-surface p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="shrink-0 text-rust-500" size={24} />
                <div>
                  <h3 className="font-heading font-bold text-foreground">Exam warning</h3>
                  <p className="mt-2 text-sm text-muted">{warning}</p>
                  <Button className="mt-4" onClick={onDismissWarning}>
                    I understand — continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>

      <p className="px-4 pb-6 text-center text-xs text-muted">
        Note: leaving this tab, switching apps, or copying is recorded. Repeated violations may
        auto-submit your exam.
      </p>
    </div>
  );
}

export function clearExamSessionFlag() {
  try {
    sessionStorage.removeItem('bda-exam-active');
  } catch {
    /* ignore */
  }
}

/** Enter fullscreen for a given element — call from a user gesture. */
export function enterExamFullscreen(el: HTMLElement | null) {
  if (!el) return Promise.resolve();
  return requestFs(el).catch(() => undefined);
}
