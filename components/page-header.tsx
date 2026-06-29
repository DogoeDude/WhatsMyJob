import { cn } from '@/lib/utils';
import { pageContainerClass } from '@/lib/ui-classes';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  action,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn('win-mica border-b-0', className)}>
      <div className={`${pageContainerClass} py-8 sm:py-10`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
