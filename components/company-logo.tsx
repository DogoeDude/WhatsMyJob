'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { companyInitials, getCompanyLogoColors } from '@/lib/jobs/logo-colors';
import { buildLogoImgSources } from '@/lib/jobs/resolve-logo';

type CompanyLogoProps = {
  company: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
};

export function CompanyLogo({ company, logoUrl, size = 'md', className }: CompanyLogoProps) {
  const sources = useMemo(() => buildLogoImgSources(logoUrl, company), [logoUrl, company]);
  const colors = useMemo(() => getCompanyLogoColors(company), [company]);
  const initials = useMemo(() => companyInitials(company), [company]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [logoUrl, company]);

  const src = sources[index];
  const showImage = index < sources.length && Boolean(src);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 font-semibold shadow-sm',
        sizeClasses[size],
        showImage ? 'bg-background' : 'ring-1 ring-inset ring-black/5',
        className
      )}
      style={
        showImage
          ? undefined
          : { backgroundColor: colors.bg, color: colors.fg }
      }
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-1"
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        <span className="select-none leading-none tracking-tight">{initials}</span>
      )}
    </div>
  );
}
