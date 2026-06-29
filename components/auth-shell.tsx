import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthShellProps = {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthShell({
  backHref,
  backLabel,
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className="win-canvas flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:bg-[var(--win-hover)] hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>

        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card shadow-[var(--win-shadow)]">
            <img src="/job.svg" alt="" width={24} height={24} className="h-6 w-6" />
          </span>
          <span className="text-base font-semibold text-foreground">WhatsMyJob</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

        <div className={cn('win-shell mt-8 rounded-lg p-6 sm:p-8', className)}>
          {children}
          {footer && (
            <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { inputSurfaceClass as authInputClass } from '@/lib/ui-classes';
