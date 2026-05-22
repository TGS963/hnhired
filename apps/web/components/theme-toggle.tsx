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
  }

  return (
    <button
      type="button"
      className="inline-flex w-7 h-7 items-center justify-center rounded-md text-fg-muted bg-transparent border-0 cursor-pointer hover:text-fg hover:bg-hover transition-colors duration-100"
      aria-label="Toggle theme"
      onClick={toggle}
      suppressHydrationWarning
    >
      {mounted && current === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
