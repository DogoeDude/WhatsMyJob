export type ListItem = { text: string; depth: number };

export type InlineSpan =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string };

export type CalloutVariant = 'salary' | 'location' | 'schedule' | 'info';

export type DescriptionBlock =
  | { kind: 'heading'; text: string; section?: string }
  | { kind: 'paragraph'; text: string; spans: InlineSpan[] }
  | { kind: 'list'; items: ListItem[] }
  | { kind: 'callout'; variant: CalloutVariant; text: string; label?: string };

const BULLET_RE =
  /^(?:[-•*–—▪·]\s*|\d+[.)]\s+|[\u2022\u2023\u25E6\u2043]\s*)(.+)$/u;
const HEADING_RE = /^#{1,3}\s+(.+)$/;
const CALLOUT_LINE_RE =
  /^(salary|compensation|pay|location|workplace|remote|schedule|hours|benefits|perks)\s*[:\-–]\s*(.+)$/i;

const SECTION_HEADING_RE =
  /^(about(\s+the)?\s+(role|job|position|us)|job\s+description|the\s+role|role\s+overview|responsibilities|requirements|qualifications|what\s+you('ll| will)|who\s+you\s+are|what\s+we\s+offer|benefits|nice\s+to\s+have|how\s+to\s+apply|tasks|key\s+tasks|your\s+profile|aufgaben|profil|angebot|voraussetzungen|bewerbung)/i;

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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
  if (line.length > 72) return false;
  if (line.endsWith(':') && line.length < 50) return true;
  if (SECTION_HEADING_RE.test(line.replace(/:$/, ''))) return true;
  if (/^[A-Z0-9][A-Z0-9\s/&-]{2,48}$/.test(line) && line === line.toUpperCase()) return true;
  return false;
}

function headingText(line: string): string {
  const hash = line.match(HEADING_RE);
  if (hash) return hash[1].trim();
  return line.replace(/:$/, '').trim();
}

function sectionKeyFromHeading(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/responsibilit|aufgaben|tasks|what you|duties/.test(lower)) return 'responsibilities';
  if (/requirement|qualification|profile|profil|voraussetzung|skills/.test(lower)) return 'requirements';
  if (/benefit|offer|angebot|perks|what we offer/.test(lower)) return 'benefits';
  if (/about|role|description|overview/.test(lower)) return 'about';
  return undefined;
}

export function parseInlineSpans(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      spans.push({ type: 'text', text: text.slice(last, match.index) });
    }
    if (match[2] || match[3]) {
      spans.push({ type: 'bold', text: (match[2] ?? match[3]).trim() });
    } else if (match[4] || match[5]) {
      spans.push({ type: 'italic', text: (match[4] ?? match[5]).trim() });
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    spans.push({ type: 'text', text: text.slice(last) });
  }

  return spans.length > 0 ? spans : [{ type: 'text', text }];
}

function detectCallout(line: string): { variant: CalloutVariant; label: string; text: string } | null {
  const labeled = line.match(CALLOUT_LINE_RE);
  if (labeled) {
    const key = labeled[1].toLowerCase();
    const body = labeled[2].trim();
    if (/salary|compensation|pay/.test(key)) return { variant: 'salary', label: labeled[1], text: body };
    if (/location|workplace|remote/.test(key)) return { variant: 'location', label: labeled[1], text: body };
    if (/schedule|hours/.test(key)) return { variant: 'schedule', label: labeled[1], text: body };
    return { variant: 'info', label: labeled[1], text: body };
  }

  if (/^\$[\d,.]+(\s*[-–]\s*\$[\d,.]+)?/i.test(line) || /^€[\d,.]+/i.test(line) || /£[\d,.]+/i.test(line)) {
    return { variant: 'salary', label: 'Salary', text: line };
  }
  if (/^(remote|hybrid|on-?site|fully remote)/i.test(line)) {
    return { variant: 'location', label: 'Workplace', text: line };
  }

  return null;
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

    const callout = detectCallout(trimmed);
    if (callout) {
      blocks.push({
        kind: 'callout',
        variant: callout.variant,
        label: callout.label,
        text: callout.text,
      });
      continue;
    }

    if (isHeading(trimmed)) {
      const text = headingText(trimmed);
      blocks.push({
        kind: 'heading',
        text,
        section: sectionKeyFromHeading(text),
      });
      continue;
    }

    blocks.push({
      kind: 'paragraph',
      text: trimmed,
      spans: parseInlineSpans(trimmed),
    });
  }

  flushList();
  return blocks;
}

export type DescriptionSection = {
  id: string;
  title?: string;
  section?: string;
  blocks: DescriptionBlock[];
};

/** Group parsed blocks into sections separated by headings. */
export function groupDescriptionIntoSections(blocks: DescriptionBlock[]): DescriptionSection[] {
  if (blocks.length === 0) return [];

  const sections: DescriptionSection[] = [];
  let current: DescriptionSection = { id: 'intro', blocks: [] };

  for (const block of blocks) {
    if (block.kind === 'heading') {
      if (current.blocks.length > 0 || current.title) {
        sections.push(current);
      }
      current = {
        id: `section-${sections.length}`,
        title: block.text,
        section: block.section,
        blocks: [],
      };
    } else {
      current.blocks.push(block);
    }
  }

  if (current.blocks.length > 0 || current.title) {
    sections.push(current);
  }

  return sections;
}
