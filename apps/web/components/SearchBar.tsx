'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Sparkles, Search, X } from 'lucide-react';

type Mode = 'ask' | 'keyword';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialNl = searchParams.get('nl') ?? '';
  const initialQ = searchParams.get('q') ?? '';
  const [mode, setMode] = useState<Mode>(initialNl ? 'ask' : initialQ ? 'keyword' : 'ask');
  const [value, setValue] = useState<string>(initialNl || initialQ || '');

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function submit() {
    const v = value.trim();
    if (!v) {
      router.push('/');
      return;
    }
    if (mode === 'ask') {
      router.push('/?nl=' + encodeURIComponent(v));
    } else {
      router.push('/?q=' + encodeURIComponent(v));
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form className="hn-search" onSubmit={onSubmit}>
      <div className="hn-search-mode">
        <button
          type="button"
          className={mode === 'ask' ? 'is-active' : ''}
          onClick={() => setMode('ask')}
        >
          <Sparkles size={12} /> Ask
        </button>
        <button
          type="button"
          className={mode === 'keyword' ? 'is-active' : ''}
          onClick={() => setMode('keyword')}
        >
          <Search size={12} /> Keyword
        </button>
      </div>
      <input
        ref={inputRef}
        className="hn-search-input"
        placeholder={mode === 'ask' ? 'Ask in plain English…' : 'Search by keyword…'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className="hn-search-clear"
          onClick={() => {
            setValue('');
            inputRef.current?.focus();
          }}
          aria-label="Clear"
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
