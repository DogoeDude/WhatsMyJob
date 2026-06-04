import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { pageContainerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';

type PageShellProps = {
  children: React.ReactNode;
  /** Full-height app shell (jobs board): no page scroll, footer hidden. */
  appLayout?: boolean;
};

export function PageShell({ children, appLayout = false }: PageShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        appLayout ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-dvh'
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <main
        id="main-content"
        className={cn(
          'page-enter flex flex-1 flex-col',
          appLayout && 'min-h-0 overflow-hidden'
        )}
      >
        {children}
      </main>
      {!appLayout && <Footer />}
    </div>
  );
}

export function PageContent({
  children,
  className = '',
  wide = false,
  fillViewport = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Wider layout for split-pane views (e.g. jobs list + detail). */
  wide?: boolean;
  /** Fill remaining main area without causing document scroll. */
  fillViewport?: boolean;
}) {
  const container = wide
    ? fillViewport
      ? 'flex h-full w-full max-w-none flex-col px-0'
      : 'mx-auto w-full max-w-[100rem] px-3 sm:px-5 lg:px-6'
    : pageContainerClass;

  return (
    <div
      className={cn(
        container,
        fillViewport
          ? 'min-h-0 flex-1 overflow-hidden'
          : 'flex-1 py-8 sm:py-10',
        className
      )}
    >
      {children}
    </div>
  );
}
