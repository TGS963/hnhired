import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import SavedCount from './SavedCount';

export default function Header() {
  return (
    <header className="hn-header">
      <div className="hn-header-inner">
        <Link href="/" className="hn-brand" aria-label="hnhired">
          <span className="hn-brand-mark">hn</span>
          <span className="hn-brand-word">hired</span>
        </Link>
        <nav className="hn-nav">
          <Link href="/" className="hn-nav-link">Browse</Link>
          <Link href="/match" className="hn-nav-link">Match</Link>
          <Link href="/?saved=1" className="hn-nav-link">
            Saved<SavedCount />
          </Link>
        </nav>
        <div className="hn-header-tools">
          <span className="hn-kbd" aria-hidden>⌘K</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
