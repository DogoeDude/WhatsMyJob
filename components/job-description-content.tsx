'use client';

import { Check } from 'lucide-react';
import { parseJobDescription, type DescriptionBlock, type ListItem } from '@/lib/jobs/format-description';
import { cn } from '@/lib/utils';

function ListItemRow({ item }: { item: ListItem }) {
  return (
    <li
      className="flex gap-3 text-[15px] leading-relaxed text-foreground/90"
      style={{ marginLeft: `${item.depth * 1.25}rem` }}
    >
      <span
        className={cn(
          'mt-2 shrink-0 rounded-full bg-primary',
          item.depth > 0 ? 'h-1 w-1' : 'h-1.5 w-1.5'
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">{item.text}</span>
    </li>
  );
}

function BlockList({ items }: { items: ListItem[] }) {
  return (
    <ul className="ml-1 space-y-2 border-l-2 border-primary/15 pl-4">
      {items.map((item, i) => (
        <ListItemRow key={`${i}-${item.text.slice(0, 20)}`} item={item} />
      ))}
    </ul>
  );
}

function RenderBlock({ block, index }: { block: DescriptionBlock; index: number }) {
  if (block.kind === 'heading') {
    return (
      <h4
        className={cn(
          'text-sm font-semibold tracking-tight text-foreground',
          index > 0 && 'mt-2'
        )}
      >
        {block.text}
      </h4>
    );
  }
  if (block.kind === 'list') {
    return <BlockList items={block.items} />;
  }
  return (
    <p className="pl-1 text-[15px] leading-[1.75] text-foreground/90">{block.text}</p>
  );
}

type JobDescriptionContentProps = {
  description: string;
  className?: string;
};

export function JobDescriptionContent({ description, className }: JobDescriptionContentProps) {
  const blocks = parseJobDescription(description);

  if (blocks.length === 0) {
    return (
      <p className={cn('text-sm italic text-muted-foreground', className)}>
        No description provided for this role.
      </p>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block, i) => (
        <RenderBlock key={i} block={block} index={i} />
      ))}
    </div>
  );
}

type JobDetailListProps = {
  title: string;
  items: string[];
};

export function JobDetailList({ title, items }: JobDetailListProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-border/60 bg-muted/20 p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <ul className="ml-1 space-y-3 border-l-2 border-primary/15 pl-4">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-3 w-3 text-primary" />
            </span>
            <span className="min-w-0 flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
