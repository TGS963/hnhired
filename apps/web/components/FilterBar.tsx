'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';

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
    <div className="hn-filters">
      <div className="hn-filters-row">
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
        <div className="hn-filters-spacer" />
        <button
          type="button"
          className={`hn-toggle ${hideSeen ? 'is-on' : ''}`}
          onClick={toggleHideSeen}
        >
          <span>Hide seen</span>
        </button>
        <button
          type="button"
          className={`hn-toggle ${savedOnly ? 'is-on' : ''}`}
          onClick={toggleSaved}
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
    <div className="hn-chip-wrap" ref={ref}>
      <button
        type="button"
        className={`hn-chip ${isActive ? 'is-active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hn-chip-label">{label}</span>
        {isActive ? (
          <span className="hn-chip-value">{valueLabel}</span>
        ) : (
          <ChevronDown size={10} />
        )}
      </button>
      {isActive && (
        <button
          type="button"
          className="hn-chip-clear"
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
        <div className="hn-popover">
          {options.map((opt) => {
            const active = value === opt.id || (!value && opt.id === 'any');
            return (
              <button
                key={opt.id}
                type="button"
                className={`hn-popover-item ${active ? 'is-active' : ''}`}
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
    <div className="hn-chip-wrap" ref={ref}>
      <button
        type="button"
        className={`hn-chip ${isActive ? 'is-active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hn-chip-label">{label}</span>
        {isActive ? (
          <span className="hn-chip-value">{valueText}</span>
        ) : (
          <ChevronDown size={10} />
        )}
      </button>
      {isActive && (
        <button
          type="button"
          className="hn-chip-clear"
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
        <div className="hn-popover">
          {options.map((opt) => {
            const active = values.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                className={`hn-popover-item ${active ? 'is-active' : ''}`}
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
