'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Projects', href: '/projects', icon: 'video_library' },
  { label: 'Characters', href: '/characters', icon: 'person_search' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
];

const createSteps: NavItem[] = [
  { label: 'Intent', href: '/create/intent', icon: 'edit_note' },
  { label: 'Brief', href: '/create/brief', icon: 'psychology' },
  { label: 'Style DNA', href: '/create/style-dna', icon: 'palette' },
  { label: 'Characters', href: '/create/character-setup', icon: 'face' },
  { label: 'Review', href: '/create/review', icon: 'movie' },
  { label: 'Generate', href: '/create/generating', icon: 'auto_awesome' },
  { label: 'Export', href: '/create/export', icon: 'download' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col bg-[#0e0e0e] z-40 md:flex">
      {/* Brand Section */}
      <div className="mb-8 px-6 pt-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff9064]">
            <span className="material-symbols-outlined text-[22px] text-[#571a00]">
              movie_filter
            </span>
          </div>
          <div>
            <h1 className="font-manrope text-xl font-bold tracking-tight text-white">
              DIRECTOR
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-[#adaaaa]">
              AI Video Engine
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                active
                  ? 'bg-[#262626] text-[#ff9064]'
                  : 'text-[#adaaaa] hover:bg-[#131313] hover:text-white'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  active ? '[font-variation-settings:"FILL"_1]' : ''
                }`}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Create Workflow Section */}
        {pathname.startsWith('/create') && (
          <>
            <div className="uppercase tracking-widest text-[10px] text-[#adaaaa] px-6 mb-2 mt-6">
              Workflow
            </div>
            {createSteps.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                    active
                      ? 'bg-[#262626] text-[#ff9064]'
                      : 'text-[#adaaaa] hover:bg-[#131313] hover:text-white'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      active ? '[font-variation-settings:"FILL"_1]' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* New Project CTA */}
      <div className="px-4 py-4">
        <Link
          href="/create/intent"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#ff9064] to-[#ff7941] px-4 py-3 font-bold text-[#571a00] transition-transform hover:scale-105"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>New Project</span>
        </Link>
      </div>

      {/* Help & Support */}
      <div className="border-t border-[#262626] px-4 py-4">
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-lg px-4 py-2 text-[#adaaaa] transition-colors hover:bg-[#131313] hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">
            help_outline
          </span>
          <span className="text-sm font-medium">Help & Support</span>
        </Link>
      </div>
    </aside>
  );
}
