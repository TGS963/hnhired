'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

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

const REMOTE_NONE = '__any_remote__';
const CONTRACT_NONE = '__any_contract__';

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

  return (
    <Card className="p-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          value={v.nl ?? ''}
          onChange={(e) => set('nl', e.target.value)}
          placeholder="e.g. remote senior Rust climate startups >150k"
          className="text-base"
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input
            value={v.q ?? ''}
            onChange={(e) => set('q', e.target.value)}
            placeholder="keyword"
          />
          <Select
            value={v.remote || REMOTE_NONE}
            onValueChange={(val) => set('remote', val === REMOTE_NONE ? '' : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="any remote" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={REMOTE_NONE}>any remote</SelectItem>
              <SelectItem value="remote">remote</SelectItem>
              <SelectItem value="hybrid">hybrid</SelectItem>
              <SelectItem value="onsite">onsite</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={v.loc ?? ''}
            onChange={(e) => set('loc', e.target.value)}
            placeholder="location"
          />
          <Input
            value={v.seniority ?? ''}
            onChange={(e) => set('seniority', e.target.value)}
            placeholder="seniority"
          />
          <Input
            value={v.tech ?? ''}
            onChange={(e) => set('tech', e.target.value)}
            placeholder="tech (comma-sep)"
          />
          <Input
            type="number"
            value={v.comp_min ?? ''}
            onChange={(e) => set('comp_min', e.target.value)}
            placeholder="min salary"
          />
          <Select
            value={v.contract || CONTRACT_NONE}
            onValueChange={(val) => set('contract', val === CONTRACT_NONE ? '' : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CONTRACT_NONE}>any type</SelectItem>
              <SelectItem value="fulltime">full-time</SelectItem>
              <SelectItem value="contract">contract</SelectItem>
              <SelectItem value="parttime">part-time</SelectItem>
              <SelectItem value="intern">intern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit">Search</Button>
          <Button type="button" variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </form>
    </Card>
  );
}
