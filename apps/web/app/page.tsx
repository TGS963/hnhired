import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { nlSearch } from '@/lib/search';
import { browse, browseCount, BROWSE_PAGE_SIZE } from '@/lib/queries';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import InfiniteJobList from '@/components/InfiniteJobList';
import JobRow, { type JobCardRow } from '@/components/JobRow';
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
    const res = await nlSearch(params.nl);
    const results = (res?.posts ?? []) as JobCardRow[];
    const whyByPostId = (res?.whyByPostId ?? {}) as Record<string, string>;
    return (
      <>
        <SearchBar />
        <FilterBar defaultValues={params} />
        {results.length === 0 ? (
          <div className="px-5 py-24 text-center border border-dashed border-border-c rounded-2xl mt-5">
            <div className="text-[15px] font-medium mb-1.5">No matches</div>
            <div className="text-fg-muted">Try a different query.</div>
          </div>
        ) : (
          <div className="flex flex-col">
            {results.map((row) => (
              <JobRow
                key={String(row.post_raw_id)}
                row={row}
                why={whyByPostId[String(row.post_raw_id)]}
                whyLabel="why"
              />
            ))}
          </div>
        )}
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

  return (
    <>
      <SearchBar />
      <FilterBar defaultValues={params} />
      <InfiniteJobList
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
