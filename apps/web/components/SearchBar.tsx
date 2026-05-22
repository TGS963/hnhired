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
    <form
      className="flex items-center gap-1 border border-border-c rounded-xl bg-surface px-2 py-1.5 mb-4 transition-[border-color,box-shadow] duration-100 focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--brand-soft)]"
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-0.5 p-0.5 bg-bg-2 rounded-[7px] border border-border-c">
        <button
          type="button"
          className={`inline-flex items-center gap-[5px] px-2 py-1 rounded-[5px] text-xs font-medium border-none cursor-pointer transition-[background,color] duration-100 ${
            mode === 'ask'
              ? 'bg-surface text-fg shadow-[0_1px_2px_oklch(0_0_0_/_0.06)]'
              : 'bg-transparent text-fg-muted hover:text-fg'
          }`}
          onClick={() => setMode('ask')}
        >
          <Sparkles size={12} /> Ask
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-[5px] px-2 py-1 rounded-[5px] text-xs font-medium border-none cursor-pointer transition-[background,color] duration-100 ${
            mode === 'keyword'
              ? 'bg-surface text-fg shadow-[0_1px_2px_oklch(0_0_0_/_0.06)]'
              : 'bg-transparent text-fg-muted hover:text-fg'
          }`}
          onClick={() => setMode('keyword')}
        >
          <Search size={12} /> Keyword
        </button>
      </div>
      <input
        ref={inputRef}
        className="flex-1 border-none bg-transparent px-2 py-1.5 outline-none text-sm text-inherit placeholder:text-fg-faint"
        placeholder={mode === 'ask' ? 'Ask in plain English…' : 'Search by keyword…'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button
          type="button"
          className="w-6 h-6 rounded-[5px] inline-flex items-center justify-center text-fg-muted bg-transparent border-none cursor-pointer hover:text-fg hover:bg-hover"
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
