import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'HN Hired',
  description: 'Hacker News "Who is hiring" browser and resume matcher.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="text-lg font-semibold tracking-tight text-neutral-900">
              HN Hired
            </a>
            <nav className="flex items-center gap-6 text-sm text-neutral-700">
              <a href="/" className="hover:text-neutral-900">Browse</a>
              <a href="/match" className="hover:text-neutral-900">Résumé Match</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-neutral-200">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-500">
            Data from{' '}
            <a
              href="https://news.ycombinator.com"
              className="underline hover:text-neutral-700"
              target="_blank"
              rel="noreferrer"
            >
              Hacker News
            </a>
            .
          </div>
        </footer>
      </body>
    </html>
  );
}
