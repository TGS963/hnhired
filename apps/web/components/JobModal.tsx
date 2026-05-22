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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/35 dark:bg-black/65 backdrop-blur-[4px] animate-fade-in max-[720px]:p-0 max-[720px]:items-stretch"
      onClick={onScrim}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[960px] max-h-[min(86vh,900px)] bg-bg dark:bg-bg-2 border border-border-strong rounded-2xl shadow-[0_1px_2px_oklch(0_0_0_/_0.06),0_24px_64px_oklch(0_0_0_/_0.28)] overflow-hidden flex flex-col animate-modal-in max-[720px]:max-h-full max-[720px]:rounded-none max-[720px]:border-none"
      >
        {children}
      </div>
    </div>
  );
}
