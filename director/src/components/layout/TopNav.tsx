'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface TopNavProps {
  title?: string;
  showSearch?: boolean;
  rightContent?: ReactNode;
}

export default function TopNav({
  title,
  showSearch = true,
  rightContent,
}: TopNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 h-16 bg-[#0e0e0e]/70 backdrop-blur-xl border-b border-[#262626] md:left-64">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section - Search */}
        <div className="flex flex-1 items-center gap-4">
          {showSearch && (
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-full bg-[#1a1a1a] px-4 py-2 text-sm text-white placeholder-[#adaaaa] ring-1 ring-[#262626] transition-all focus:outline-none focus:ring-2 focus:ring-[#ff9064]/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#adaaaa]">
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Right Section - Icons and User */}
        <div className="ml-auto flex items-center gap-4">
          {rightContent ? (
            rightContent
          ) : (
            <>
              {/* Notification Bell */}
              <button className="relative rounded-full p-2 transition-colors hover:bg-[#262626]">
                <span className="material-symbols-outlined text-[#adaaaa] text-[20px] transition-colors hover:text-white">
                  notifications_none
                </span>
                {/* Notification Indicator */}
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[#ff9064]"></span>
              </button>

              {/* Help Icon */}
              <Link
                href="/help"
                className="rounded-full p-2 transition-colors hover:bg-[#262626]"
              >
                <span className="material-symbols-outlined text-[#adaaaa] text-[20px] transition-colors hover:text-white">
                  help_outline
                </span>
              </Link>

              {/* User Avatar and Name */}
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">Alex Rivera</p>
                  <p className="text-xs text-[#adaaaa]">Director Pro</p>
                </div>
                <button className="h-10 w-10 overflow-hidden rounded-full bg-[#262626] ring-1 ring-[#3a3a3a] transition-transform hover:scale-105">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=alexrivera"
                    alt="User Avatar"
                    className="h-full w-full object-cover"
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
