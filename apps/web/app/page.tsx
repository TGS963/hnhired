import { nlSearch } from '@/lib/search';
import { browse, BROWSE_PAGE_SIZE } from '@/lib/queries';
import FilterBar from '@/components/FilterBar';
import JobCard, { type JobCardRow } from '@/components/JobCard';
import InfiniteJobList from '@/components/InfiniteJobList';

type SearchParams = {
  q?: string;
  remote?: string;
  loc?: string;
  seniority?: string;
  tech?: string;
  comp_min?: string;
  contract?: string;
  nl?: string;
};

const BROWSE_KEYS = ['q', 'remote', 'loc', 'seniority', 'tech', 'comp_min', 'contract'] as const;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  if (params.nl && params.nl.trim().length > 0) {
    const res = await nlSearch(params.nl);
    const results = (res?.posts ?? []) as JobCardRow[];
    const whyByPostId = (res?.whyByPostId ?? {}) as Record<string, string>;
    return (
      <div className="space-y-6">
        <FilterBar defaultValues={params} />
        {results.length === 0 ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-12 text-center text-sm text-neutral-600">
            No matches
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((row) => (
              <JobCard
                key={String(row.post_raw_id)}
                row={row}
                why={whyByPostId[String(row.post_raw_id)]}
              />
            ))}
          </div>
        )}
      </div>
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

  const initial = (await browse(usp, { limit: BROWSE_PAGE_SIZE, offset: 0 })) as JobCardRow[];
  const initialNextOffset = initial.length === BROWSE_PAGE_SIZE ? BROWSE_PAGE_SIZE : null;

  return (
    <div className="space-y-6">
      <FilterBar defaultValues={params} />
      {initial.length === 0 ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-12 text-center text-sm text-neutral-600">
          No matches
        </div>
      ) : (
        <InfiniteJobList
          initial={initial}
          initialNextOffset={initialNextOffset}
          filters={filters}
        />
      )}
    </div>
  );
}
