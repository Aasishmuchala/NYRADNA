'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const options = [
    { value: 'light', icon: 'light_mode' },
    { value: 'dark', icon: 'dark_mode' },
    { value: 'system', icon: 'monitor' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-container p-1 border border-outline-variant/20">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
            theme === opt.value
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
          title={opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}
        >
          <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
        </button>
      ))}
    </div>
  );
}
