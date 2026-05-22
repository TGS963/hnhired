import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import SavedCount from './SavedCount';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] backdrop-blur-[12px] backdrop-saturate-[180%] border-b border-border-c">
      <div className="max-w-[1200px] mx-auto px-8 h-14 flex items-center gap-8 max-[720px]:px-4 max-[720px]:gap-3">
        <Link href="/" className="flex items-baseline gap-px font-mono text-sm tracking-[-0.02em]" aria-label="hnhired">
          <span className="bg-brand text-brand-contrast px-[5px] py-0.5 rounded-[4px] font-semibold">hn</span>
          <span className="font-medium text-fg ml-1">hired</span>
        </Link>
        <nav className="flex gap-0.5">
          <Link href="/" className="px-2.5 py-1.5 rounded-[6px] text-fg-muted text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 hover:text-fg hover:bg-hover">Browse</Link>
          <Link href="/match" className="px-2.5 py-1.5 rounded-[6px] text-fg-muted text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 hover:text-fg hover:bg-hover">Match</Link>
          <Link href="/?saved=1" className="px-2.5 py-1.5 rounded-[6px] text-fg-muted text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors duration-100 hover:text-fg hover:bg-hover">
            Saved<SavedCount />
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="font-mono text-[10.5px] px-1.5 py-0.5 border border-border-c rounded-[4px] text-fg-muted bg-surface tracking-normal" aria-hidden>⌘K</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
