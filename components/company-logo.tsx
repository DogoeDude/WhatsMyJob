'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { buildLogoImgSources } from '@/lib/jobs/resolve-logo';

type CompanyLogoProps = {
  company: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-10 w-10 text-base',
  md: 'h-12 w-12 text-lg',
  lg: 'h-16 w-16 text-2xl',
};

export function CompanyLogo({ company, logoUrl, size = 'md', className }: CompanyLogoProps) {
  const sources = useMemo(() => buildLogoImgSources(logoUrl, company), [logoUrl, company]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [logoUrl, company]);

  const src = sources[index];
  const showImage = index < sources.length && Boolean(src);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted font-semibold text-muted-foreground',
        sizeClasses[size],
        showImage && 'bg-background',
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-1"
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        (company.trim().charAt(0) || '?').toUpperCase()
      )}
    </div>
  );
}
