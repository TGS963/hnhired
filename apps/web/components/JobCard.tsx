import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type JobCardRow = {
  post_raw_id: string | number;
  company?: string | null;
  role_titles?: string[] | null;
  locations?: string[] | null;
  remote_policy?: string | null;
  currency?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  posted_at?: string | null;
  tech_stack?: string[] | null;
};

function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function formatSalary(row: JobCardRow): string | null {
  if (row.salary_min == null && row.salary_max == null) return null;
  const cur = row.currency ?? '';
  const lo = row.salary_min != null ? row.salary_min.toLocaleString() : '?';
  const hi = row.salary_max != null ? row.salary_max.toLocaleString() : '?';
  return `${cur} ${lo}–${hi}`.trim();
}

export default function JobCard({
  row,
  whyLabel,
  why,
  rank,
}: {
  row: JobCardRow;
  whyLabel?: string;
  why?: string | null;
  rank?: number;
}) {
  const id = String(row.post_raw_id);
  const title = row.role_titles?.[0] ?? '';
  const loc = (row.locations ?? []).join(', ');
  const salary = formatSalary(row);

  return (
    <Card className="transition-colors hover:bg-accent/40">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {rank != null && <Badge>#{rank}</Badge>}
            <CardTitle className="text-base">{row.company ?? 'Unknown'}</CardTitle>
          </div>
          {row.remote_policy ? <Badge variant="outline">{row.remote_policy}</Badge> : null}
        </div>
        {title ? <p className="text-sm text-muted-foreground">{title}</p> : null}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {loc ? <div className="text-xs text-muted-foreground">{loc}</div> : null}
        {salary ? <div className="text-xs">{salary}</div> : null}
        <div className="text-xs text-muted-foreground">{relativeTime(row.posted_at)}</div>
        {row.tech_stack && row.tech_stack.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.tech_stack.slice(0, 5).map((t) => (
              <Badge key={t} variant="secondary" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
        {why ? (
          <p className="text-xs italic text-muted-foreground">
            {whyLabel ?? 'why this matched'}: {why}
          </p>
        ) : null}
        <Button asChild variant="link" size="sm" className="px-0">
          <a href={`/job/${id}`}>View →</a>
        </Button>
      </CardContent>
    </Card>
  );
}
