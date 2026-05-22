import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Résumé Match — rank HN jobs by fit',
  description:
    'Paste your résumé to rank this month\'s Hacker News "Who is hiring?" postings by fit. Résumé is stored in your browser; only sent to rank or draft outreach.',
  alternates: { canonical: '/match' },
  robots: { index: true, follow: true },
};

export default function MatchLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
