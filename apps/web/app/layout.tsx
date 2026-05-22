import type { ReactNode } from 'react';
import type { Metadata } from 'next';
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

export default function RootLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <html lang="en" className={plexMono.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="hnhired:theme"
        >
          <div className="hn-app-content">
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 w-full max-w-[1200px] mx-auto pt-8 px-8 pb-24 max-[720px]:pt-5 max-[720px]:px-4 max-[720px]:pb-20">
                {children}
              </main>
            </div>
          </div>
          {modal}
        </ThemeProvider>
      </body>
    </html>
  );
}
