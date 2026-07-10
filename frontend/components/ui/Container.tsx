import { cn } from '@/lib/utils';

/** Consistent max-width + horizontal padding wrapper. */
export function Container({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string;
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  return <Tag className={cn('container-bda', className)}>{children}</Tag>;
}
