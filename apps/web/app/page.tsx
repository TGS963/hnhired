import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { nlSearch } from '@/lib/search';
import { browse, browseCount, BROWSE_PAGE_SIZE } from '@/lib/queries';
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
  nl?: string;
  saved?: string;
};

const BROWSE_KEYS = ['q', 'remote', 'loc', 'seniority', 'tech', 'comp_min', 'contract'] as const;

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
    let results: JobCardRow[] = [];
    let whyByPostId: Record<string, string> = {};
    let nlError: string | null = null;
    try {
      const res = await nlSearch(params.nl);
      results = (res?.posts ?? []) as JobCardRow[];
      whyByPostId = (res?.whyByPostId ?? {}) as Record<string, string>;
    } catch (err) {
      console.error('nlSearch failed:', err);
      nlError = 'AI search is temporarily unavailable. Try Keyword mode instead.';
    }
    return (
      <>
        <SearchBar />
        <FilterBar defaultValues={params} />
        <NlResultsList results={results} whyByPostId={whyByPostId} error={nlError} />
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
  const [initial, total] = await Promise.all([
    browse(usp, { limit: BROWSE_PAGE_SIZE, offset: 0 }) as Promise<JobCardRow[]>,
    browseCount(usp),
  ]);
  const initialNextOffset = initial.length === BROWSE_PAGE_SIZE ? BROWSE_PAGE_SIZE : null;
  const searchKey = usp.toString() + (savedOnly ? '|saved' : '');

  return (
    <>
      <SearchBar />
      <FilterBar defaultValues={params} />
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
