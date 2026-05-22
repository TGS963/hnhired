import type { ReactNode } from 'react';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata = {
  title: 'HN Hired',
  description: 'Hacker News "Who is hiring" browser and resume matcher.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <a href="/" className="text-lg font-semibold tracking-tight">
                HN Hired
              </a>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/" className="text-muted-foreground hover:text-foreground">
                  Browse
                </a>
                <a href="/match" className="text-muted-foreground hover:text-foreground">
                  Résumé Match
                </a>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mt-16 border-t">
            <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
              Data from{' '}
              <a
                href="https://news.ycombinator.com"
                className="underline hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                Hacker News
              </a>
              .
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
