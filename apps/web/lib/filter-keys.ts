export const FILTER_KEYS = [
  'remote',
  'seniority',
  'tech',
  'comp_min',
  'contract',
  'loc',
  'saved',
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];
