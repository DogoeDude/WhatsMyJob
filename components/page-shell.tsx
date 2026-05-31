import { Footer } from '@/components/footer';
import { MeshBackground } from '@/components/mesh-background';
import { Navbar } from '@/components/navbar-client';
import { pageContainerClass } from '@/lib/ui-classes';

type PageShellProps = {
  children: React.ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="app-mesh relative flex min-h-screen flex-col overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <MeshBackground />
      <Navbar />
      <main id="main-content" className="page-fade-in relative z-10 flex flex-1 flex-col">
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
    <div className={`${pageContainerClass} flex-1 py-10 sm:py-12 ${className}`}>
      {children}
    </div>
  );
}
