'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { proxiedLogoUrl } from '@/lib/jobs/logo-proxy';

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
  const [failed, setFailed] = useState(false);
  const initial = (company.trim().charAt(0) || '?').toUpperCase();
  const showImage = Boolean(logoUrl) && !failed;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-primary/10',
        sizeClasses[size],
        showImage
          ? 'bg-background'
          : 'bg-gradient-to-br from-primary/15 to-primary/5 font-bold text-primary',
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- proxied external logos
        <img
          key={logoUrl}
          src={proxiedLogoUrl(logoUrl!)}
          alt=""
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </div>
  );
}
