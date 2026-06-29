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
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl, company]);

  const src = sources[0];
  const showImage = Boolean(src) && !imageFailed;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg font-semibold',
        sizeClasses[size],
        showImage
          ? 'border border-border bg-background shadow-[var(--win-shadow)]'
          : 'border border-black/[0.06] shadow-sm',
        className
      )}
      style={
        showImage
          ? undefined
          : { backgroundColor: colors.bg, color: colors.fg }
      }
      title={company}
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
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="select-none leading-none tracking-tight">{initials}</span>
      )}
    </div>
  );
}
