/**
 * Single source of truth for filter query-param keys.
 * Used by both the client (SearchBar) and server (queries.ts / browse API route)
 * so that adding a new filter only requires updating this file.
 */
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
