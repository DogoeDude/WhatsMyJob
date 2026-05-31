import { cn } from '@/lib/utils';

type SectionCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  variant?: 'glass' | 'elevated';
};

export function SectionCard({
  title,
  description,
  children,
  className,
  headerAction,
  variant = 'elevated',
}: SectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 sm:p-7',
        variant === 'glass' ? 'surface-glass' : 'surface-elevated',
        className
      )}
    >
      {(title || headerAction) && (
        <div className="mb-6 flex flex-col gap-3 border-b border-border/50 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
            )}
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
}
