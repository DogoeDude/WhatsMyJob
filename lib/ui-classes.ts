export const inputSurfaceClass =
  'h-9 rounded-md border border-border bg-card px-3 text-sm shadow-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40';

export const searchInputClass =
  'h-9 rounded-md border border-border bg-card pl-10 pr-3 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

export const pageContainerClass = 'mx-auto w-full max-w-5xl px-4 sm:px-6';

/** Full-width header: brand flush left, account flush right (viewport edges + padding). */
export const siteHeaderInnerClass =
  'flex h-12 w-full items-center justify-between gap-4 px-4 sm:h-14 sm:px-6 lg:px-8';

/** Height reserved for fixed mobile bottom navigation + safe area. */
export const mobileBottomNavSpacerClass =
  'pointer-events-none h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] shrink-0 lg:hidden';

export const selectSurfaceClass =
  'h-9 w-full rounded-md border border-border bg-card px-3 text-sm shadow-none focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

export const filterChipClass =
  'inline-flex items-center justify-center rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-normal text-foreground transition-colors hover:bg-[var(--win-hover)] disabled:pointer-events-none disabled:opacity-50';

export const filterChipActiveClass =
  'border-border bg-[var(--win-selected)] text-foreground';

export const filterSidebarInputClass =
  'h-9 w-full rounded-md border border-border bg-card px-3 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

export const filterSidebarSearchClass =
  'h-9 w-full rounded-md border border-border bg-card pl-10 pr-3 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40';

export const filterPanelClass =
  'rounded-lg border border-border bg-secondary p-3';

export const filterAccordionTriggerClass =
  'py-3 text-sm font-semibold text-foreground hover:no-underline [&>svg]:text-muted-foreground';

export const winSettingsGroupClass = 'win-settings-group overflow-hidden';

export const winPanelClass = 'win-surface rounded-lg';

export const winMessageBannerClass =
  'rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground';

export const winStickyFooterClass =
  'sticky bottom-0 z-10 border-t border-border bg-card px-4 py-3 shadow-[var(--win-shadow)]';
