import {
  Briefcase,
  Code2,
  HeartPulse,
  LayoutGrid,
  Megaphone,
  MoreHorizontal,
  Palette,
  TrendingUp,
  Users,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
import { ALL_CATEGORY_ID } from '@/lib/jobs/categories';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  [ALL_CATEGORY_ID]: LayoutGrid,
  it: Code2,
  business: Briefcase,
  design: Palette,
  marketing: Megaphone,
  finance: Landmark,
  healthcare: HeartPulse,
  hr: Users,
  sales: TrendingUp,
  other: MoreHorizontal,
};

export function getCategoryIcon(categoryId: string): LucideIcon {
  return CATEGORY_ICONS[categoryId] ?? LayoutGrid;
}
