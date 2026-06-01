'use client';

import { pageContainerClass } from '@/lib/ui-classes';
import { JOB_SOURCES_CATALOG } from '@/lib/jobs/sources-catalog';

const DEVELOPER_LINKEDIN = 'https://www.linkedin.com/in/reggie-hermosisima-0937a8275';
const DEVELOPER_GITHUB = 'https://github.com/DogoeDude';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className={`${pageContainerClass} py-8`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-medium text-foreground">WhatsMyJob</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Aggregates listings from public job board APIs. Job content belongs to each
              provider and employer.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Sources</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {JOB_SOURCES_CATALOG.slice(0, 6).map((source) => (
                <li key={source.id}>
                  <a
                    href={source.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Built by</p>
            <p className="mt-1 text-muted-foreground">
              <a
                href={DEVELOPER_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                Reggie Hermosisima
              </a>
              {' · '}
              <a
                href={DEVELOPER_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                GitHub
              </a>
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {year} WhatsMyJob
        </p>
      </div>
    </footer>
  );
}
