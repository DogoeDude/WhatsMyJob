import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const iconColors = {
  accent: 'bg-primary/10 text-primary ring-primary/20',
  blue: 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
  purple: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400',
  pink: 'bg-pink-500/10 text-pink-600 ring-pink-500/20 dark:text-pink-400',
  amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
  red: 'bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400',
} as const;

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  iconColor?: keyof typeof iconColors;
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconColor = 'accent',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'surface-elevated group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_oklch(0.48_0.19_275/0.15)] sm:p-6',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105',
            iconColors[iconColor]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="section-label mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && (
            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
