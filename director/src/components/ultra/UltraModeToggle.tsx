'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWizard } from '@/context/WizardContext';
import { isUltraUnlocked } from '@/lib/ultraLock';
import { UltraGate } from './UltraGate';

/**
 * Toggle component for Ultra Mode.
 * Shows a labeled switch with purple glow when active.
 * If Ultra is not unlocked, shows the password gate modal first.
 */
export function UltraModeToggle() {
  const { state, update } = useWizard();
  const [showGate, setShowGate] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // Sync unlock status on mount (sessionStorage is client-only)
  useEffect(() => {
    setUnlocked(isUltraUnlocked());
  }, []);

  const handleToggle = useCallback(() => {
    if (state.ultraModeEnabled) {
      // Turning OFF — no password needed
      update({ ultraModeEnabled: false });
      return;
    }

    // Turning ON — check if already unlocked
    if (isUltraUnlocked()) {
      update({ ultraModeEnabled: true });
    } else {
      setShowGate(true);
    }
  }, [state.ultraModeEnabled, update]);

  const handleUnlock = useCallback(() => {
    setShowGate(false);
    setUnlocked(true);
    update({ ultraModeEnabled: true });
  }, [update]);

  return (
    <>
      <button
        onClick={handleToggle}
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer ${
          state.ultraModeEnabled
            ? 'border-primary/40 bg-primary/5 shadow-[0_0_24px_rgba(198,191,255,0.12)]'
            : 'border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/40'
        }`}
      >
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            state.ultraModeEnabled ? 'bg-primary/20' : 'bg-surface-container-highest'
          }`}
        >
          <span
            className={`material-symbols-outlined text-lg transition-colors ${
              state.ultraModeEnabled ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            movie_filter
          </span>
        </div>

        {/* Label */}
        <div className="flex-1 text-left">
          <span
            className={`text-[10px] tracking-[0.3em] uppercase font-bold block transition-colors ${
              state.ultraModeEnabled ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            Ultra Mode
          </span>
          <span className="text-[10px] text-on-surface-variant/60">
            Film-grade consistency pipeline
          </span>
        </div>

        {/* Toggle switch */}
        <div
          className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
            state.ultraModeEnabled ? 'bg-primary' : 'bg-surface-container-highest'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
              state.ultraModeEnabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </div>

        {/* Active glow ring */}
        {state.ultraModeEnabled && (
          <div className="absolute inset-0 rounded-xl ring-1 ring-primary/20 pointer-events-none" />
        )}
      </button>

      {/* Password gate modal */}
      <UltraGate
        open={showGate}
        onClose={() => setShowGate(false)}
        onUnlock={handleUnlock}
      />
    </>
  );
}
