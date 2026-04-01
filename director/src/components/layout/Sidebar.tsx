'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'space_dashboard' },
  { label: 'Projects', href: '/projects', icon: 'video_library' },
  { label: 'Assets', href: '/assets', icon: 'photo_library' },
  { label: 'Characters', href: '/characters', icon: 'person_search' },
  { label: 'Settings', href: '/settings', icon: 'tune' },
];

const createSteps: NavItem[] = [
  { label: 'Intent', href: '/create/intent', icon: 'edit_note' },
  { label: 'Brief', href: '/create/brief', icon: 'psychology' },
  { label: 'Characters', href: '/create/character-setup', icon: 'face' },
  { label: 'Assets', href: '/assets', icon: 'photo_library' },
  { label: 'Style DNA', href: '/create/style-dna', icon: 'palette' },
  { label: 'Review', href: '/create/review', icon: 'auto_videocam' },
  { label: 'Pipeline', href: '/create/pipeline', icon: 'account_tree' },
  { label: 'Generate', href: '/create/generating', icon: 'auto_awesome' },
  { label: 'Export', href: '/create/export', icon: 'ios_share' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && href !== '/assets' && pathname.startsWith(href));

  // Stay in create flow mode even when visiting /assets (keeps sidebar consistent)
  const inCreateFlow = pathname.startsWith('/create') || (pathname === '/assets' && typeof window !== 'undefined' && sessionStorage.getItem('director-in-create') === '1');

  // Track create flow state
  if (typeof window !== 'undefined') {
    if (pathname.startsWith('/create')) {
      sessionStorage.setItem('director-in-create', '1');
    } else if (pathname !== '/assets') {
      sessionStorage.removeItem('director-in-create');
    }
  }

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center px-4 py-3 transition-all duration-500 group ${
          active
            ? 'text-on-surface border-r-2 border-primary bg-primary/5'
            : 'text-on-surface-variant hover:text-on-surface hover:translate-x-1'
        }`}
      >
        <span className={`material-symbols-outlined mr-4 text-[20px] ${
          active ? 'text-primary' : 'opacity-70 group-hover:opacity-100'
        } transition-opacity`}>
          {item.icon}
        </span>
        <span className="text-[10px] tracking-[0.25em] uppercase font-semibold font-label">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full pt-24 pb-8 flex flex-col z-40 w-64 border-r border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-2xl">
      {/* Project Header */}
      <div className="px-8 mb-12">
        <h2 className="text-on-surface text-xs tracking-[0.3em] font-bold uppercase mb-1">
          {inCreateFlow ? 'New Project' : 'DIRECTOR'}
        </h2>
        <p className="text-on-surface-variant text-[9px] tracking-widest uppercase">
          {inCreateFlow ? 'Creation Phase' : 'AI Video Engine'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
        {(inCreateFlow ? createSteps : navItems).map(renderItem)}
      </nav>

      {/* Bottom */}
      <div className="px-4 mt-auto space-y-2 pt-8 border-t border-outline-variant/20">
        <Link href="/settings" className="flex items-center px-4 py-3 text-on-surface-variant hover:text-on-surface transition-all duration-500">
          <span className="material-symbols-outlined mr-4 text-sm">help_outline</span>
          <span className="text-[10px] tracking-[0.25em] uppercase font-semibold font-label">Support</span>
        </Link>
      </div>
    </aside>
  );
}
