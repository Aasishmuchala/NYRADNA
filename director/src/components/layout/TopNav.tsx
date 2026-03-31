'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-surface-container-lowest/80 backdrop-blur-3xl border-b border-outline-variant/20">
      {/* Brand */}
      <div className="text-xl font-bold tracking-[0.3em] text-on-surface uppercase font-headline">
        DIRECTOR
      </div>

      {/* Center Links */}
      <div className="hidden md:flex items-center space-x-12">
        <Link href="/projects" className="text-[10px] tracking-[0.2em] font-medium font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300">
          Projects
        </Link>
        <Link href="/assets" className="text-[10px] tracking-[0.2em] font-medium font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300">
          Assets
        </Link>
        <Link href="/characters" className="text-[10px] tracking-[0.2em] font-medium font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-300">
          Characters
        </Link>
      </div>

      {/* Right Icons */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <div className="relative group hidden md:block">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface transition-colors cursor-pointer">
            notifications
          </span>
        </div>
        <Link href="/settings">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            settings
          </span>
        </Link>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container flex items-center justify-center">
          <span className="text-xs font-bold text-on-surface-variant">U</span>
        </div>
      </div>
    </nav>
  );
}
