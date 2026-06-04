export const inputSurfaceClass =
  'h-10 rounded-md border border-input bg-background px-3 text-sm shadow-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30';

export const searchInputClass =
  'h-11 rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30';

export const pageContainerClass = 'mx-auto w-full max-w-5xl px-4 sm:px-6';

/** Full-width header: brand flush left, account flush right (viewport edges + padding). */
export const siteHeaderInnerClass =
  'flex h-14 w-full items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:h-[4.5rem] lg:px-8';

/** Height reserved for fixed mobile bottom navigation + safe area. */
export const mobileBottomNavSpacerClass =
  'pointer-events-none h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] shrink-0 lg:hidden';

export const selectSurfaceClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30';

export const filterChipClass =
  'inline-flex items-center justify-center rounded-lg border border-transparent bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50';

export const filterChipActiveClass =
  'border-primary/30 bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary hover:text-primary-foreground';

export const filterSidebarInputClass =
  'h-10 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm shadow-none ring-1 ring-border/50 transition-shadow placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35';

export const filterSidebarSearchClass =
  'h-11 w-full rounded-xl border-0 bg-muted/50 pl-10 pr-3 text-sm shadow-none ring-1 ring-border/60 transition-shadow placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export const filterPanelClass =
  'rounded-xl bg-muted/25 p-3 ring-1 ring-border/40';

export const filterAccordionTriggerClass =
  'py-3 text-sm font-semibold text-foreground hover:no-underline [&>svg]:text-muted-foreground';
