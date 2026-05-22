'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function JobModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('hn-modal-open');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.back();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('hn-modal-open');
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [router]);

  function onScrim(e: React.MouseEvent) {
    if (e.target === e.currentTarget) router.back();
  }

  return (
    <div className="hn-detail-scrim" onClick={onScrim}>
      <div className="hn-detail" ref={panelRef} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
