// ─── Ultra Mode Password Lock ───────────────────────────────────────
//
// Guards Ultra Mode behind a session-scoped password gate.
// Uses sessionStorage so unlock expires when the browser tab closes.

const ULTRA_PASSWORD = 'DIRECTOR_ULTRA_2026';

/**
 * Check whether Ultra Mode is currently unlocked in this session.
 */
export function isUltraUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('ultra-unlocked') === '1';
}

/**
 * Attempt to unlock Ultra Mode with a password.
 * Returns true if the password matches, false otherwise.
 */
export function unlockUltra(password: string): boolean {
  if (password === ULTRA_PASSWORD) {
    sessionStorage.setItem('ultra-unlocked', '1');
    return true;
  }
  return false;
}

/**
 * Re-lock Ultra Mode for this session.
 */
export function lockUltra(): void {
  sessionStorage.removeItem('ultra-unlocked');
}
