'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="py-24 px-5 text-center border border-dashed border-border-c rounded-[12px] mt-5">
      <div className="text-[15px] font-medium mb-1.5">Something went wrong</div>
      <div className="text-fg-muted text-sm mb-5">
        The page failed to load. This is usually temporary.
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-[14px] py-[7px] border border-border-c rounded-[7px] text-[13px] font-medium text-fg bg-surface cursor-pointer hover:bg-hover hover:border-border-strong active:translate-y-[0.5px] transition-colors duration-100"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-[14px] py-[7px] text-[13px] font-medium text-fg-muted hover:text-fg transition-colors duration-100"
        >
          Back to browse
        </Link>
      </div>
    </div>
  );
}
