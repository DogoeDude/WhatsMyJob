import { cn } from '@/lib/utils';

type SectionCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
};

export function SectionCard({
  title,
  description,
  children,
  className,
  headerAction,
}: SectionCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card', className)}>
      {(title || headerAction) && (
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
