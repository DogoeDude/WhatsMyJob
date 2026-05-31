export type ListItem = { text: string; depth: number };

export type DescriptionBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: ListItem[] };

const BULLET_RE = /^(?:[-•*–—]\s*|\d+[.)]\s+)(.+)$/;
const HEADING_RE = /^#{1,3}\s+(.+)$/;

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function lineIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  return Math.floor(match[1].replace(/\t/g, '  ').length / 2);
}

function lineContent(line: string): string {
  return line.trim();
}

function isHeading(line: string): boolean {
  if (HEADING_RE.test(line)) return true;
  if (line.length > 55) return false;
  if (line.endsWith(':')) return true;
  if (/^[A-Z0-9][A-Z0-9\s/&-]{2,48}$/.test(line) && line === line.toUpperCase()) return true;
  return false;
}

function headingText(line: string): string {
  const hash = line.match(HEADING_RE);
  if (hash) return hash[1].trim();
  return line.replace(/:$/, '').trim();
}

/** Turn raw job-board text into readable blocks for the UI. */
export function parseJobDescription(raw: string): DescriptionBlock[] {
  const text = normalizeText(raw);
  if (!text) return [];

  const blocks: DescriptionBlock[] = [];
  let listItems: ListItem[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ kind: 'list', items: [...listItems] });
    listItems = [];
  };

  for (const rawLine of text.split('\n')) {
    const trimmed = lineContent(rawLine);
    if (!trimmed) {
      flushList();
      continue;
    }

    const bullet = trimmed.match(BULLET_RE);
    if (bullet) {
      listItems.push({
        text: bullet[1].trim(),
        depth: lineIndent(rawLine),
      });
      continue;
    }

    flushList();

    if (isHeading(trimmed)) {
      blocks.push({ kind: 'heading', text: headingText(trimmed) });
      continue;
    }

    blocks.push({ kind: 'paragraph', text: trimmed });
  }

  flushList();
  return blocks;
}
