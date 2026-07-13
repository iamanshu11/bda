'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { cn } from '@/lib/utils';

interface WishlistItem {
  courseId: string;
}

/** Heart toggle to save/remove a course from the wishlist. */
export function WishlistButton({
  courseId,
  className,
  withLabel = false,
}: {
  courseId: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get('/students/wishlist')).data.data as WishlistItem[],
    enabled: status === 'authenticated',
    retry: false,
  });

  const saved = Boolean(wishlist?.some((w) => w.courseId === courseId));

  const toggle = useMutation({
    mutationFn: async () => {
      if (saved) return api.delete(`/students/wishlist/${courseId}`);
      return api.post('/students/wishlist', { courseId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== 'authenticated') {
      router.push('/login?redirect=/courses');
      return;
    }
    toggle.mutate();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={saved}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full transition-colors',
        withLabel ? 'px-3 py-1.5 text-sm' : 'h-9 w-9 justify-center',
        saved ? 'text-rust-500' : 'text-muted hover:text-rust-500',
        className,
      )}
    >
      {toggle.isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Heart size={18} className={saved ? 'fill-rust-500' : ''} />
      )}
      {withLabel && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
