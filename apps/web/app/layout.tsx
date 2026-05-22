import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Header from '@/components/Header';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — HN "Who is hiring?" jobs, searchable & résumé-matched`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Hacker News jobs',
    'Who is hiring',
    'remote jobs',
    'startup jobs',
    'job search',
    'résumé match',
    'HN hiring thread',
    'tech jobs',
  ],
  category: 'jobs',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — HN "Who is hiring?" jobs`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — HN "Who is hiring?" jobs`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
  authors: [{ name: SITE_NAME }],
};

export default async function RootLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('hnhired:theme')?.value;
  const theme = themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : 'light';

  return (
    <html lang="en" data-theme={theme} className={plexMono.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme={theme}
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="hn-app-content">
            <div className="hn-app">
              <Header />
              <main className="hn-main">{children}</main>
              <footer className="hn-footer">
                Data from{' '}
                <a href="https://news.ycombinator.com" target="_blank" rel="noreferrer">
                  Hacker News
                </a>
                .
              </footer>
            </div>
          </div>
          {modal}
        </ThemeProvider>
      </body>
    </html>
  );
}
