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
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>

        <div className="mb-6 flex items-center gap-2">
          <img src="/job.svg" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-semibold text-foreground">WhatsMyJob</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

        <div
          className={cn(
            'mt-8 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8',
            className
          )}
        >
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
