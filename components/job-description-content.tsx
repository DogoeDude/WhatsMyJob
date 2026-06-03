'use client';

import { Check, DollarSign, MapPin, Clock, Info } from 'lucide-react';
import {
  groupDescriptionIntoSections,
  parseJobDescription,
  parseInlineSpans,
  type DescriptionBlock,
  type DescriptionSection,
  type InlineSpan,
  type ListItem,
} from '@/lib/jobs/format-description';
import { cn } from '@/lib/utils';

function InlineContent({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, i) => {
        if (span.type === 'bold') {
          return (
            <strong key={i} className="font-medium text-foreground">
              {span.text}
            </strong>
          );
        }
        if (span.type === 'italic') {
          return <em key={i}>{span.text}</em>;
        }
        return <span key={i}>{span.text}</span>;
      })}
    </>
  );
}

function CalloutBlock({
  variant,
  label,
  text,
}: {
  variant: 'salary' | 'location' | 'schedule' | 'info';
  label?: string;
  text: string;
}) {
  const styles = {
    salary: { icon: DollarSign, bar: 'bg-emerald-500' },
    location: { icon: MapPin, bar: 'bg-sky-500' },
    schedule: { icon: Clock, bar: 'bg-amber-500' },
    info: { icon: Info, bar: 'bg-muted-foreground' },
  }[variant];

  const Icon = styles.icon;

  return (
    <div className="flex overflow-hidden rounded-md border border-border bg-muted/40">
      <span className={cn('w-1 shrink-0', styles.bar)} aria-hidden />
      <div className="flex min-w-0 flex-1 gap-3 px-4 py-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 text-sm leading-relaxed">
          {label && (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          )}
          <p className={cn('text-foreground/90', label && 'mt-0.5')}>{text}</p>
        </div>
      </div>
    </div>
  );
}

function BlockList({ items }: { items: ListItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li
          key={`${i}-${item.text.slice(0, 32)}`}
          className="flex gap-3 text-[15px] leading-relaxed text-foreground/85"
          style={{ marginLeft: `${item.depth * 1.25}rem` }}
        >
          <span
            className="mt-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/12"
            aria-hidden
          >
            <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <InlineContent spans={parseInlineSpans(item.text)} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function BlockContent({ block }: { block: DescriptionBlock }) {
  if (block.kind === 'callout') {
    return <CalloutBlock variant={block.variant} label={block.label} text={block.text} />;
  }
  if (block.kind === 'list') {
    return <BlockList items={block.items} />;
  }
  return (
    <p className="text-[15px] leading-[1.75] text-foreground/85">
      <InlineContent spans={block.spans} />
    </p>
  );
}

function DescriptionSectionCard({ section }: { section: DescriptionSection }) {
  const hasTitle = Boolean(section.title);

  return (
    <section
      className={cn(
        'w-full',
        hasTitle && 'rounded-lg border border-border/80 bg-muted/25 px-5 py-4 sm:px-6 sm:py-5'
      )}
    >
      {hasTitle && (
        <h4 className="mb-4 text-[15px] font-semibold text-foreground">{section.title}</h4>
      )}
      <div className="space-y-4">
        {section.blocks.map((block, i) => (
          <BlockContent key={i} block={block} />
        ))}
      </div>
    </section>
  );
}

type JobDescriptionContentProps = {
  description: string;
  className?: string;
};

export function JobDescriptionContent({ description, className }: JobDescriptionContentProps) {
  const blocks = parseJobDescription(description);
  const sections = groupDescriptionIntoSections(blocks);

  if (sections.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No description provided for this role.
      </p>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {sections.map((section) => (
        <DescriptionSectionCard key={section.id} section={section} />
      ))}
    </div>
  );
}

type JobDetailListProps = {
  title: string;
  items: string[];
  variant?: 'requirements' | 'benefits';
};

export function JobDetailList({ title, items, variant = 'requirements' }: JobDetailListProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-lg border border-border bg-card px-5 py-4 sm:px-6 sm:py-5">
      <h3 className="mb-4 text-[15px] font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex gap-3 text-[15px] leading-relaxed text-foreground/85"
          >
            <span
              className="mt-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/12"
              aria-hidden
            >
              <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              <InlineContent spans={parseInlineSpans(item)} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
