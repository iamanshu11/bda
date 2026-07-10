import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 text-navy-600 dark:bg-navy-800 dark:text-navy-200">
        <Icon size={24} />
      </span>
      <div>
        <p className="font-heading text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}
