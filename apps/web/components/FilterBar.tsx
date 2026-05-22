'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

type Values = {
  q?: string;
  remote?: string;
  loc?: string;
  seniority?: string;
  tech?: string;
  comp_min?: string;
  contract?: string;
  nl?: string;
};

export default function FilterBar({ defaultValues }: { defaultValues: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>({
    q: defaultValues.q ?? '',
    remote: defaultValues.remote ?? '',
    loc: defaultValues.loc ?? '',
    seniority: defaultValues.seniority ?? '',
    tech: defaultValues.tech ?? '',
    comp_min: defaultValues.comp_min ?? '',
    contract: defaultValues.contract ?? '',
    nl: defaultValues.nl ?? '',
  });

  function set<K extends keyof Values>(k: K, val: string) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sp = new URLSearchParams();
    (Object.keys(v) as (keyof Values)[]).forEach((k) => {
      const val = v[k];
      if (val && val.trim().length > 0) sp.set(k, val.trim());
    });
    const qs = sp.toString();
    router.push(qs ? `/?${qs}` : '/');
  }

  function onClear() {
    setV({ q: '', remote: '', loc: '', seniority: '', tech: '', comp_min: '', contract: '', nl: '' });
    router.push('/');
  }

  const input =
    'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 hover:bg-neutral-50 focus:border-neutral-400 focus:outline-none';

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-md border border-neutral-200 bg-white p-4"
    >
      <input
        type="text"
        value={v.nl ?? ''}
        onChange={(e) => set('nl', e.target.value)}
        placeholder="e.g. remote senior Rust climate startups >150k"
        className={`${input} text-base`}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <input
          type="text"
          value={v.q ?? ''}
          onChange={(e) => set('q', e.target.value)}
          placeholder="keyword"
          className={input}
        />
        <select
          value={v.remote ?? ''}
          onChange={(e) => set('remote', e.target.value)}
          className={input}
        >
          <option value="">any remote</option>
          <option value="remote">remote</option>
          <option value="hybrid">hybrid</option>
          <option value="onsite">onsite</option>
        </select>
        <input
          type="text"
          value={v.loc ?? ''}
          onChange={(e) => set('loc', e.target.value)}
          placeholder="location"
          className={input}
        />
        <input
          type="text"
          value={v.seniority ?? ''}
          onChange={(e) => set('seniority', e.target.value)}
          placeholder="seniority"
          className={input}
        />
        <input
          type="text"
          value={v.tech ?? ''}
          onChange={(e) => set('tech', e.target.value)}
          placeholder="tech (comma-sep)"
          className={input}
        />
        <input
          type="number"
          value={v.comp_min ?? ''}
          onChange={(e) => set('comp_min', e.target.value)}
          placeholder="min salary"
          className={input}
        />
        <select
          value={v.contract ?? ''}
          onChange={(e) => set('contract', e.target.value)}
          className={input}
        >
          <option value="">any type</option>
          <option value="fulltime">full-time</option>
          <option value="contract">contract</option>
          <option value="parttime">part-time</option>
          <option value="intern">intern</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Search
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
