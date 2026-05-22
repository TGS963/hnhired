'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'hnhired:resume';

export function useResume() {
  const [resume, setResumeState] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v != null) setResumeState(v);
    } catch {}
    setHydrated(true);
  }, []);

  const setResume = useCallback((next: string) => {
    setResumeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  }, []);

  const clear = useCallback(() => {
    setResumeState('');
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  return { resume, setResume, clear, hydrated };
}
