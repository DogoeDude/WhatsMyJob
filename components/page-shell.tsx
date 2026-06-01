import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar-client';
import { pageContainerClass } from '@/lib/ui-classes';

type PageShellProps = {
  children: React.ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="page-enter flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function PageContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${pageContainerClass} flex-1 py-8 sm:py-10 ${className}`}>
      {children}
    </div>
  );
}
