'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (theme === 'system' ? resolvedTheme : theme) ?? 'light';
  const next = current === 'dark' ? 'light' : 'dark';

  function toggle() {
    setTheme(next);
    try {
      document.cookie = `hnhired:theme=${next};path=/;max-age=31536000;samesite=lax`;
    } catch {}
  }

  return (
    <button
      type="button"
      className="hn-icon-btn"
      aria-label="Toggle theme"
      onClick={toggle}
      suppressHydrationWarning
    >
      {mounted && current === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
