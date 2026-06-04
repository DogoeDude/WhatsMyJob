import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Uniform height for all profile form controls. */
export const profileControlClass =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30';

type ProfileFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  hintError?: boolean;
  className?: string;
  children: ReactNode;
};

export function ProfileField({
  label,
  htmlFor,
  hint,
  hintError,
  className,
  children,
}: ProfileFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium leading-none">
        {label}
      </Label>
      {children}
      {hint && (
        <p
          className={cn(
            'text-xs',
            hintError ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

type ProfileFieldGridProps = {
  children: ReactNode;
  className?: string;
};

/** Two equal columns from `md` up; single column on small screens. */
export function ProfileFieldGrid({ children, className }: ProfileFieldGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4', className)}>
      {children}
    </div>
  );
}

type ProfileSubpanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function ProfileSubpanel({ title, children, className }: ProfileSubpanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/10 p-4',
        className
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}
