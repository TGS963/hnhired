import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { nlSearch, EXPLICIT_DIMS } from '@/lib/search';
import { browse, browseCount, BROWSE_PAGE_SIZE } from '@/lib/queries';
import { getAvailableMonths, getStackFacetsByPopularity } from '@/lib/stories-api';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import InfiniteJobList from '@/components/InfiniteJobList';
import NlResultsList from '@/components/NlResultsList';
import type { JobCardRow } from '@/components/JobRow';
import type { Layout } from '@/components/LayoutToggle';

export const metadata: Metadata = {
  title: 'Browse HN "Who is hiring?" jobs — remote, salary, stack filters',
  description:
    'Search this month\'s Hacker News "Who is hiring?" thread. Filter by remote, salary, seniority, and tech stack. AI-summarized listings with résumé matching.',
  alternates: { canonical: '/' },
};

type SearchParams = {
  q?: string;
  remote?: string;
  loc?: string;
  seniority?: string;
  tech?: string;
  comp_min?: string;
  contract?: string;
  month?: string;
  nl?: string;
  saved?: string;
};

const BROWSE_KEYS = ['month', 'q', 'remote', 'loc', 'seniority', 'tech', 'comp_min', 'contract'] as const;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const layoutCookie = cookieStore.get('hnhired:layout')?.value;
  const initialLayout: Layout = layoutCookie === 'cards' ? 'cards' : 'rows';

  if (params.nl && params.nl.trim().length > 0) {
    const nlFilters = new URLSearchParams();
    for (const key of EXPLICIT_DIMS) {
      const v = params[key];
      if (typeof v === 'string' && v) nlFilters.set(key, v);
    }
    const hasFilters = nlFilters.toString().length > 0;

    let results: JobCardRow[] = [];
    let nlError: string | null = null;
    const [nlRes, months, stack] = await Promise.allSettled([
      nlSearch(params.nl, hasFilters ? nlFilters : undefined),
      getAvailableMonths(),
      getStackFacetsByPopularity(),
    ]);
    if (nlRes.status === 'fulfilled') {
      results = (nlRes.value?.posts ?? []) as JobCardRow[];
    } else {
      console.error('nlSearch failed:', nlRes.reason);
      nlError = 'AI search is temporarily unavailable. Try Keyword mode instead.';
    }
    const monthList = months.status === 'fulfilled' ? months.value : [];
    const stackOptions = stack.status === 'fulfilled' ? stack.value : [];
    return (
      <>
        <SearchBar />
        <FilterBar defaultValues={params} months={monthList} stackOptions={stackOptions} />
        <NlResultsList results={results} error={nlError} />
      </>
    );
  }

  const filters: Record<string, string> = {};
  const usp = new URLSearchParams();
  for (const key of BROWSE_KEYS) {
    const v = params[key];
    if (typeof v === 'string' && v) {
      filters[key] = v;
      usp.set(key, v);
    }
  }

  const savedOnly = params.saved === '1';
  const monthsPromise = getAvailableMonths().catch(() => []);
  const stackOptionsPromise = getStackFacetsByPopularity().catch(() => []);
  const [initial, total] = await Promise.all([
    browse(usp, { limit: BROWSE_PAGE_SIZE, offset: 0 }) as Promise<JobCardRow[]>,
    browseCount(usp),
  ]);
  const months = await monthsPromise;
  const stackOptions = await stackOptionsPromise;
  const initialNextOffset = initial.length === BROWSE_PAGE_SIZE ? BROWSE_PAGE_SIZE : null;
  const searchKey = usp.toString() + (savedOnly ? '|saved' : '');

  return (
    <>
      <SearchBar />
      <FilterBar defaultValues={params} months={months} stackOptions={stackOptions} />
      <InfiniteJobList
        key={searchKey}
        initial={initial}
        initialNextOffset={initialNextOffset}
        filters={filters}
        initialLayout={initialLayout}
        savedOnly={savedOnly}
        total={total}
      />
    </>
  );
}
