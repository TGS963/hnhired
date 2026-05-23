'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { CHIP_BASE, CHIP_ACTIVE, CHIP_INACTIVE } from '@/lib/ui';

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

type Option = { id: string; label: string };

const REMOTE_OPTS: Option[] = [
  { id: 'any', label: 'Any' },
  { id: 'remote', label: 'Remote' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'Onsite' },
];

const COMP_OPTS: Option[] = [
  { id: 'any', label: 'Any' },
  { id: '100000', label: '≥ $100k' },
  { id: '150000', label: '≥ $150k' },
  { id: '200000', label: '≥ $200k' },
  { id: '250000', label: '≥ $250k' },
];

const SENIORITY_OPTS: Option[] = [
  { id: 'any', label: 'Any' },
  { id: 'junior', label: 'Junior' },
  { id: 'mid', label: 'Mid' },
  { id: 'senior', label: 'Senior' },
  { id: 'staff', label: 'Staff' },
  { id: 'principal', label: 'Principal' },
];

const STACK_OPTS = [
  'python',
  'typescript',
  'rust',
  'go',
  'java',
  'react',
  'kubernetes',
  'postgres',
  'aws',
  'ml',
];

const POPOVER =
  'absolute top-[calc(100%+4px)] left-0 min-w-[180px] max-h-[320px] overflow-y-auto bg-surface border border-border-c rounded-lg shadow-[var(--shadow-pop)] p-1 z-30';
const POPOVER_ITEM_BASE =
  'w-full flex items-center justify-between px-2 py-1.5 rounded-[5px] text-[13px] bg-transparent border-0 cursor-pointer text-left transition-colors duration-100 hover:bg-hover';

const CHIP_VALUE =
  'font-medium text-brand dark:text-[color:color-mix(in_oklch,var(--brand)_70%,white)]';

export default function FilterBar({ defaultValues }: { defaultValues: Values }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const remote = defaultValues.remote ?? '';
  const comp_min = defaultValues.comp_min ?? '';
  const seniority = defaultValues.seniority ?? '';
  const tech = defaultValues.tech ?? '';
  const techList = tech ? tech.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const savedOnly = searchParams.get('saved') === '1';

  const [hideSeen, setHideSeen] = useState(false);
  useEffect(() => {
    try {
      setHideSeen(localStorage.getItem('hnhired:hidden') === '1');
    } catch {}
  }, []);

  function setParam(key: string, value: string | null) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'any') {
      sp.delete(key);
    } else {
      sp.set(key, value);
    }
    const qs = sp.toString();
    router.replace(qs ? `/?${qs}` : '/');
  }

  function toggleHideSeen() {
    const next = !hideSeen;
    setHideSeen(next);
    try {
      localStorage.setItem('hnhired:hidden', next ? '1' : '');
    } catch {}
    window.dispatchEvent(new Event('hnhired:hidden-changed'));
  }

  function toggleSaved() {
    setParam('saved', savedOnly ? null : '1');
  }

  function toggleTech(t: string) {
    const has = techList.includes(t);
    const next = has ? techList.filter((x) => x !== t) : [...techList, t];
    setParam('tech', next.length ? next.join(',') : null);
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 flex-wrap py-1 max-[720px]:gap-1">
        <SingleChip
          label="Remote"
          value={remote}
          options={REMOTE_OPTS}
          onChange={(v) => setParam('remote', v)}
          onClear={() => setParam('remote', null)}
        />
        <SingleChip
          label="Min comp"
          value={comp_min}
          options={COMP_OPTS}
          onChange={(v) => setParam('comp_min', v)}
          onClear={() => setParam('comp_min', null)}
        />
        <SingleChip
          label="Seniority"
          value={seniority}
          options={SENIORITY_OPTS}
          onChange={(v) => setParam('seniority', v)}
          onClear={() => setParam('seniority', null)}
        />
        <MultiChip
          label="Stack"
          values={techList}
          options={STACK_OPTS}
          onToggle={toggleTech}
          onClear={() => setParam('tech', null)}
        />
        <div className="flex-1 min-w-[12px]" />
        <button
          type="button"
          className={`${CHIP_BASE} ${hideSeen ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          onClick={toggleHideSeen}
        >
          <span>Hide seen</span>
        </button>
        <button
          type="button"
          className={`${CHIP_BASE} ${savedOnly ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          onClick={toggleSaved}
          aria-current={savedOnly ? 'page' : undefined}
          aria-pressed={savedOnly}
        >
          <span>Saved only</span>
        </button>
      </div>
    </div>
  );
}

function SingleChip({
  label,
  value,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const isActive = !!value && value !== 'any';
  const valueLabel = options.find((o) => o.id === value)?.label;

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        className={`${CHIP_BASE} ${isActive ? CHIP_ACTIVE : CHIP_INACTIVE}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={isActive ? 'text-fg-muted' : ''}>{label}</span>
        {isActive ? (
          <span className={CHIP_VALUE}>{valueLabel}</span>
        ) : (
          <ChevronDown size={10} />
        )}
      </button>
      {isActive && (
        <button
          type="button"
          className="-ml-1 w-[18px] h-[18px] rounded-[4px] inline-flex items-center justify-center text-fg-muted bg-transparent border-0 cursor-pointer hover:text-fg hover:bg-hover"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label="Clear"
        >
          <X size={12} />
        </button>
      )}
      {open && (
        <div className={POPOVER}>
          {options.map((opt) => {
            const active = value === opt.id || (!value && opt.id === 'any');
            return (
              <button
                key={opt.id}
                type="button"
                className={`${POPOVER_ITEM_BASE} ${active ? 'text-brand' : 'text-fg'}`}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                {opt.label}
                {active && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MultiChip({
  label,
  values,
  options,
  onToggle,
  onClear,
}: {
  label: string;
  values: string[];
  options: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const isActive = values.length > 0;
  const valueText = values.length === 1 ? values[0] : `${values.length} selected`;

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        className={`${CHIP_BASE} ${isActive ? CHIP_ACTIVE : CHIP_INACTIVE}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={isActive ? 'text-fg-muted' : ''}>{label}</span>
        {isActive ? (
          <span className={CHIP_VALUE}>{valueText}</span>
        ) : (
          <ChevronDown size={10} />
        )}
      </button>
      {isActive && (
        <button
          type="button"
          className="-ml-1 w-[18px] h-[18px] rounded-[4px] inline-flex items-center justify-center text-fg-muted bg-transparent border-0 cursor-pointer hover:text-fg hover:bg-hover"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label="Clear"
        >
          <X size={12} />
        </button>
      )}
      {open && (
        <div className={POPOVER}>
          {options.map((opt) => {
            const active = values.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                className={`${POPOVER_ITEM_BASE} ${active ? 'text-brand' : 'text-fg'}`}
                onClick={() => onToggle(opt)}
              >
                {opt}
                {active && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
