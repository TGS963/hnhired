'use client';

import { useEffect, useState } from 'react';

export default function SavedCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    function read() {
      try {
        const raw = localStorage.getItem('hnhired:saved');
        const arr = raw ? (JSON.parse(raw) as unknown) : [];
        setCount(Array.isArray(arr) ? arr.length : 0);
      } catch {
        setCount(0);
      }
    }
    read();
    function onStorage(e: StorageEvent) {
      if (e.key === 'hnhired:saved') read();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('hnhired:saved-changed', read);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hnhired:saved-changed', read);
    };
  }, []);

  if (!count) return null;
  return <span className="font-mono text-[10px] bg-brand-soft text-brand px-[5px] py-px rounded-full ml-0.5">{count}</span>;
}
