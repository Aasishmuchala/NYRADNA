'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Don't render anything until mounted — prevents hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <span className="material-symbols-outlined text-3xl text-on-primary">movie_filter</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold font-headline">Sign in to Director</h1>
          <p className="text-on-surface-variant">Create an account or log in to get started.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
