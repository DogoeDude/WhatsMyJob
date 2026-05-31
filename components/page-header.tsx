import { cn } from '@/lib/utils';
import { pageContainerClass } from '@/lib/ui-classes';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  badge,
  action,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn('relative border-b border-border/40', className)}>
      <div className={`${pageContainerClass} py-8 sm:py-12`}>
        <div className="surface-elevated relative overflow-hidden rounded-2xl p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl"
            aria-hidden
          />

          {badge && <span className="badge-pill mb-4">{badge}</span>}

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                <span className="text-gradient">{title}</span>
              </h1>
              {subtitle && (
                <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          {children && <div className="relative mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}
