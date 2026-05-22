'use client';

import { Rows3, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';

export type Layout = 'rows' | 'cards';

const BTN_BASE =
  'inline-flex items-center gap-[5px] px-2 py-1 rounded-[5px] text-xs font-medium bg-transparent border-none cursor-pointer transition-colors duration-100 text-fg-muted hover:text-fg';
const BTN_ACTIVE = 'bg-surface text-fg shadow-[0_1px_2px_oklch(0_0_0_/_0.06)]';

export default function LayoutToggle({
  initial,
  onChange,
}: {
  initial: Layout;
  onChange?: (l: Layout) => void;
}) {
  const [layout, setLayout] = useState<Layout>(initial);

  useEffect(() => {
    onChange?.(layout);
  }, [layout, onChange]);

  function set(l: Layout) {
    setLayout(l);
    try {
      document.cookie = `hnhired:layout=${l};path=/;max-age=31536000;samesite=lax`;
    } catch {}
  }

  return (
    <div className="ml-auto flex items-center gap-0.5 p-0.5 bg-bg-2 rounded-[7px] border border-border-c">
      <button
        type="button"
        className={layout === 'rows' ? `${BTN_BASE} ${BTN_ACTIVE}` : BTN_BASE}
        onClick={() => set('rows')}
        aria-label="Row layout"
      >
        <Rows3 size={12} />
      </button>
      <button
        type="button"
        className={layout === 'cards' ? `${BTN_BASE} ${BTN_ACTIVE}` : BTN_BASE}
        onClick={() => set('cards')}
        aria-label="Card layout"
      >
        <LayoutGrid size={12} />
      </button>
    </div>
  );
}
