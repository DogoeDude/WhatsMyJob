'use client';

import { Button } from '@/components/ui/button';
import { JobDescriptionContent } from '@/components/job-description-content';
import { cn } from '@/lib/utils';

type GuestJobDescriptionGateProps = {
  description: string;
  source?: string;
  onSignIn: () => void;
  className?: string;
};

function GuestDescriptionBody({ text }: { text: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-foreground/90">
      <JobDescriptionContent description={text} />
    </div>
  );
}

export function GuestJobDescriptionGate({
  description,
  source,
  onSignIn,
  className,
}: GuestJobDescriptionGateProps) {
  const text = description.trim();
  const hasPreview = text.length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="relative max-h-[28rem] overflow-hidden pb-16">
        {hasPreview ? (
          <GuestDescriptionBody text={text} />
        ) : (
          <div className="space-y-3 text-[15px] leading-relaxed text-foreground/85">
            <p>
              The full posting covers responsibilities, qualifications, and benefits
              {source ? ` from ${source}` : ' for this role'}.
            </p>
            <p className="text-muted-foreground">
              Sign in to read the complete description here.
            </p>
          </div>
        )}

        {hasPreview && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-card via-card/90 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 backdrop-blur-[1px] [mask-image:linear-gradient(to_top,black,transparent)]"
              aria-hidden
            />
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-border bg-card pt-4">
        <Button type="button" onClick={onSignIn}>
          {hasPreview ? 'Read full description' : 'View job description'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Sign in or create a free account
        </p>
      </div>
    </div>
  );
}
