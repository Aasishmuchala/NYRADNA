'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { unlockUltra } from '@/lib/ultraLock';

interface UltraGateProps {
  open: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

/**
 * Password-prompt modal that gates Ultra Mode activation.
 * Shows a glassmorphism overlay with password input.
 */
export function UltraGate({ open, onClose, onUnlock }: UltraGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      setPassword('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = useCallback(() => {
    if (!password.trim()) {
      setError('Enter the Ultra Mode password');
      return;
    }

    const success = unlockUltra(password);
    if (success) {
      setError(null);
      onUnlock();
    } else {
      setError('Invalid password');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }, [password, onUnlock]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/90 backdrop-blur-xl shadow-2xl shadow-primary/10 p-8 transition-transform ${
          shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">lock</span>
          </div>
          <div>
            <h2 className="text-lg font-bold font-headline text-on-surface">
              Ultra Mode
            </h2>
            <p className="text-xs text-on-surface-variant tracking-wide">
              Enter password to unlock film-grade pipeline
            </p>
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onClose();
              }}
              placeholder="Password"
              className={`w-full px-4 py-3 bg-surface-container-highest text-on-surface rounded-lg border transition-colors font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                error
                  ? 'border-error/50 focus:border-error'
                  : 'border-outline-variant/30 focus:border-primary'
              }`}
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-error font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-on-surface-variant text-xs tracking-[0.15em] uppercase font-bold hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary-fixed text-xs tracking-[0.15em] uppercase font-bold shadow-[0_0_20px_rgba(198,191,255,0.15)] hover:scale-105 active:scale-95 transition-all"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
