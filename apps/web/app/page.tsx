import { nlSearch } from '@/lib/search';
import { browse } from '@/lib/queries';
import FilterBar from '@/components/FilterBar';
import JobCard, { type JobCardRow } from '@/components/JobCard';

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let results: JobCardRow[] = [];
  let whyByPostId: Record<string, string> = {};

  if (params.nl && params.nl.trim().length > 0) {
    const res = await nlSearch(params.nl);
    results = (res?.posts ?? []) as JobCardRow[];
    whyByPostId = (res?.whyByPostId ?? {}) as Record<string, string>;
  } else {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === 'string') usp.set(k, v);
    }
    results = (await browse(usp)) as JobCardRow[];
  }

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
