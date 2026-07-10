'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 ' +
        (className ?? '')
      }
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
