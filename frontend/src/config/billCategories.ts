/**
 * config/billCategories.ts
 * -----------------------
 * Static bill category definitions — presentation-layer config.
 * These never change at runtime. Moved from PostgreSQL to frontend
 * to eliminate an unnecessary API round-trip for 6 immutable rows.
 */

export const BILL_CATEGORIES = [
  {
    id:      'electricity',
    label:   'Electricity',
    icon:    'Zap',
    color:   'text-yellow-400',
    bg:      'bg-yellow-500/10',
    border:  'border-yellow-500/20',
  },
  {
    id:      'water',
    label:   'Water Bill',
    icon:    'Droplet',
    color:   'text-blue-400',
    bg:      'bg-blue-500/10',
    border:  'border-blue-500/20',
  },
  {
    id:      'gas',
    label:   'Gas',
    icon:    'Flame',
    color:   'text-orange-400',
    bg:      'bg-orange-500/10',
    border:  'border-orange-500/20',
  },
  {
    id:      'internet',
    label:   'Internet',
    icon:    'Globe',
    color:   'text-cyan-400',
    bg:      'bg-cyan-500/10',
    border:  'border-cyan-500/20',
  },
  {
    id:      'education',
    label:   'Education',
    icon:    'BookOpen',
    color:   'text-green-400',
    bg:      'bg-green-500/10',
    border:  'border-green-500/20',
  },
  {
    id:      'tv',
    label:   'Cable TV',
    icon:    'Tv',
    color:   'text-purple-400',
    bg:      'bg-purple-500/10',
    border:  'border-purple-500/20',
  },
] as const;

export type BillCategoryId = typeof BILL_CATEGORIES[number]['id'];
