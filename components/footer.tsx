'use client';

import { Github, Linkedin } from 'lucide-react';
import { pageContainerClass } from '@/lib/ui-classes';
import { JOB_SOURCES_CATALOG } from '@/lib/jobs/sources-catalog';

const DEVELOPER_LINKEDIN = 'https://www.linkedin.com/in/reggie-hermosisima-0937a8275';
const DEVELOPER_GITHUB = 'https://github.com/DogoeDude';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-auto border-t border-border/50 bg-card/60 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
        aria-hidden
      />
      <div className={`${pageContainerClass} py-14`}>
        <div className="mb-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
                <img src="/job.svg" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">WhatsMyJob</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Job discovery powered by public APIs from trusted job boards and aggregators — not
              scraped without permission.
            </p>
          </div>

          <div className="lg:col-span-6">
            <h4 className="mb-2 text-xs font-semibold tracking-wider text-foreground uppercase">
              Job data partners
            </h4>
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Huge thanks to the teams behind these APIs and feeds. WhatsMyJob aggregates their
              listings; all trademarks and job content belong to the respective providers.
            </p>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {JOB_SOURCES_CATALOG.map((source) => (
                <li key={source.id}>
                  <a
                    href={source.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex flex-col"
                  >
                    <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {source.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{source.description}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-xs font-semibold tracking-wider text-foreground uppercase">
              Developer
            </h4>
            <ul className="mb-4 space-y-2.5">
              <li>
                <a
                  href={DEVELOPER_LINKEDIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  LinkedIn — Reggie Hermosisima
                </a>
              </li>
              <li>
                <a
                  href={DEVELOPER_GITHUB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  GitHub — DogoeDude
                </a>
              </li>
            </ul>
            <div className="flex gap-2">
              <a
                href={DEVELOPER_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developer LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:shadow-sm"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href={DEVELOPER_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developer GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground transition-all hover:border-primary/30 hover:text-primary hover:shadow-sm"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            © {currentYear} WhatsMyJob. Listings © their respective job boards and employers.
          </p>
        </div>
      </div>
    </footer>
  );
}
