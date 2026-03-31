'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/10 backdrop-blur-3xl border-b border-white/10 md:left-64">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section - Search */}
        <div className="flex flex-1 items-center gap-4">
          {showSearch && (
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-full bg-white/5 backdrop-blur-xl px-4 py-2 text-sm text-on-surface placeholder-on-surface-variant border border-white/10 transition-all focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
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
              <button className="relative rounded-full p-2 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30" aria-label="Notifications">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] transition-colors hover:text-white">
                  notifications_none
                </span>
                {/* Notification Indicator */}
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true"></span>
              </button>

              {/* Help Icon */}
              <Link
                href="/help"
                className="rounded-full p-2 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Help and support"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] transition-colors hover:text-white">
                  help_outline
                </span>
              </Link>

              {/* User Avatar and Name */}
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-on-surface">{user?.name ?? 'User'}</p>
                  <p className="text-xs text-on-surface-variant">{user?.plan ?? 'Free'}</p>
                </div>
                <button className="h-10 w-10 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30" aria-label="User profile menu">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-on-surface-variant">
                      {initials}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
