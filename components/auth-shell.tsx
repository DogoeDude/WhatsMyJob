import Link from 'next/link';
import { ArrowLeft, Briefcase, Sparkles } from 'lucide-react';
import { MeshBackground } from '@/components/mesh-background';
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
    <div className="auth-mesh relative min-h-screen overflow-hidden">
      <MeshBackground />

      <div className="page-fade-in relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:py-14">
        <aside className="mb-10 lg:mb-0 lg:flex-1">
          <Link
            href={backHref}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card shadow-md shadow-primary/10 ring-1 ring-border/60">
              <img src="/job.svg" alt="" width={28} height={28} className="h-7 w-7 opacity-90" />
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-0.5">
              <span className="text-base font-bold leading-none tracking-tight text-foreground">
                WhatsMyJob
              </span>
              <span className="text-xs leading-none text-muted-foreground">
                Job discovery platform
              </span>
            </div>
          </div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>

          <ul className="mt-10 hidden space-y-4 sm:block">
            {[
              { icon: Briefcase, text: 'Browse curated roles from top boards' },
              { icon: Sparkles, text: 'Track market trends and salary insights' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <main className={cn('w-full lg:max-w-md lg:shrink-0', className)}>
          <div className="surface-elevated rounded-2xl p-6 sm:p-8 lg:p-9">
            {children}
            {footer && (
              <div className="mt-6 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

type RoleCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'user' | 'admin';
};

export function RoleCard({ icon, title, description, onClick, variant = 'user' }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full rounded-xl border p-4 text-left transition-all duration-200',
        'shadow-sm hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variant === 'user'
          ? 'border-accent/25 bg-accent/5 hover:border-accent/45 hover:bg-accent/10 hover:shadow-accent/10'
          : 'border-border/70 bg-card/60 hover:border-foreground/15 hover:bg-muted/40'
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
            variant === 'user'
              ? 'bg-accent text-accent-foreground shadow-sm shadow-accent/25'
              : 'bg-foreground/5 text-foreground ring-1 ring-border'
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1 space-y-1 text-left">
          <p className="font-semibold leading-snug text-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

export { inputSurfaceClass as authInputClass } from '@/lib/ui-classes';
