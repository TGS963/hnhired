'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import SavedCount from './SavedCount';

const ICON_BTN =
  'inline-flex w-7 h-7 items-center justify-center rounded-md text-fg-muted bg-transparent border-0 hover:text-fg hover:bg-hover transition-colors duration-100';

const NAV_BASE =
  'px-2.5 py-1.5 rounded-[6px] text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100';
const NAV_INACTIVE = 'text-fg-muted hover:text-fg hover:bg-hover';
const NAV_ACTIVE = 'text-fg bg-hover';

function GithubMark({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSaved = searchParams.get('saved') === '1';

  const isBrowse = pathname === '/' && !isSaved;
  const isMatch = pathname === '/match';
  const isSavedTab = pathname === '/' && isSaved;

  return (
    <header className="sticky top-0 z-20 bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] backdrop-blur-[12px] backdrop-saturate-[180%] border-b border-border-c">
      <div className="max-w-[1200px] mx-auto px-8 h-14 flex items-center gap-8 max-[720px]:px-4 max-[720px]:gap-3">
        <Link href="/" className="flex items-baseline gap-px font-mono text-sm tracking-[-0.02em]" aria-label="hnhired">
          <span className="bg-brand text-brand-contrast px-[5px] py-0.5 rounded-[4px] font-semibold">hn</span>
          <span className="font-medium text-fg ml-1">hired</span>
        </Link>
        <nav className="flex gap-0.5">
          <Link
            href="/"
            className={`${NAV_BASE} ${isBrowse ? NAV_ACTIVE : NAV_INACTIVE}`}
            aria-current={isBrowse ? 'page' : undefined}
          >
            Browse
          </Link>
          <Link
            href="/match"
            className={`${NAV_BASE} ${isMatch ? NAV_ACTIVE : NAV_INACTIVE}`}
            aria-current={isMatch ? 'page' : undefined}
          >
            Match
          </Link>
          <Link
            href="/?saved=1"
            className={`${NAV_BASE} ${isSavedTab ? NAV_ACTIVE : NAV_INACTIVE}`}
            aria-current={isSavedTab ? 'page' : undefined}
          >
            Saved<SavedCount />
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://news.ycombinator.com"
            target="_blank"
            rel="noreferrer"
            className="text-fg-muted text-[12px] hover:text-fg transition-colors duration-100 max-[720px]:hidden"
            title="Data sourced from Hacker News 'Who is hiring?' threads"
          >
            via HN
          </a>
          <a
            href="https://github.com/TGS963/hnhired"
            target="_blank"
            rel="noreferrer"
            className={ICON_BTN}
            aria-label="GitHub repository"
            title="Source on GitHub"
          >
            <GithubMark size={15} />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
