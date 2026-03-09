'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="theme-switch-placeholder" aria-hidden="true" />;
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      className={`theme-switch ${isDark ? 'dark' : 'light'}`}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle Dark Mode"
      role="switch"
      aria-checked={isDark}
    >
      <div className="theme-switch-track">
        <div className="theme-switch-thumb">
          <span className="icon">{isDark ? '🌙' : '🌞'}</span>
        </div>
      </div>
    </button>
  );
}
