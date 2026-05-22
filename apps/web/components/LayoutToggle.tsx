'use client';

import { Rows3, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';

export type Layout = 'rows' | 'cards';

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
    <div className="hn-search-mode" style={{ marginLeft: 'auto' }}>
      <button
        type="button"
        className={layout === 'rows' ? 'is-active' : ''}
        onClick={() => set('rows')}
        aria-label="Row layout"
      >
        <Rows3 size={12} />
      </button>
      <button
        type="button"
        className={layout === 'cards' ? 'is-active' : ''}
        onClick={() => set('cards')}
        aria-label="Card layout"
      >
        <LayoutGrid size={12} />
      </button>
    </div>
  );
}
