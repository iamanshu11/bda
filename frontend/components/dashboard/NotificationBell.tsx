'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const countQuery = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => (await api.get('/students/notifications/unread-count')).data.data.count as number,
    refetchInterval: 60000,
  });

  const listQuery = useQuery({
    queryKey: ['notif-list'],
    queryFn: async () => (await api.get('/students/notifications')).data.data as Notification[],
    enabled: open,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notif-count'] });
    qc.invalidateQueries({ queryKey: ['notif-list'] });
  };

  const markAll = useMutation({
    mutationFn: () => api.post('/students/notifications/read-all'),
    onSuccess: invalidate,
  });
  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/students/notifications/${id}/read`),
    onSuccess: invalidate,
  });

  const unread = countQuery.data ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={19} className="shrink-0" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <span className="truncate text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-navy-600 hover:underline dark:text-navy-200"
              >
                <Check size={12} className="shrink-0" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="py-8 text-center"><Loader2 className="mx-auto animate-spin text-navy-500" size={20} /></div>
            ) : !listQuery.data || listQuery.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No notifications yet.</p>
            ) : (
              listQuery.data.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markOne.mutate(n.id)}
                  className={cn('block w-full border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-surface-alt', !n.isRead && 'bg-navy-50/50 dark:bg-navy-900/30')}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rust-500" />}
                    <div className={cn(n.isRead && 'pl-4')}>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{n.body}</p>
                      <p className="mt-1 text-[11px] text-muted">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
