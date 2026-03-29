// Client-side localStorage-based API key storage
// Keys are stored encoded (base64 — not true encryption, but prevents casual snooping)
// In production, these would be stored server-side per user

export interface ApiKeys {
  replicate: string;
  openrouter: string;
}

const STORAGE_KEY = 'director-api-keys';

function encode(value: string): string {
  if (!value) return '';
  try {
    return btoa(encodeURIComponent(value));
  } catch {
    return '';
  }
}

function decode(value: string): string {
  if (!value) return '';
  try {
    return decodeURIComponent(atob(value));
  } catch {
    return '';
  }
}

export function getApiKeys(): ApiKeys {
  if (typeof window === 'undefined') {
    return { replicate: '', openrouter: '' };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { replicate: '', openrouter: '' };
    const stored = JSON.parse(raw) as Record<string, string>;
    return {
      replicate: decode(stored.replicate ?? ''),
      openrouter: decode(stored.openrouter ?? ''),
    };
  } catch {
    return { replicate: '', openrouter: '' };
  }
}

export function setApiKey(provider: keyof ApiKeys, key: string): void {
  if (typeof window === 'undefined') return;
  const keys = getApiKeys();
  keys[provider] = key;
  const encoded: Record<string, string> = {
    replicate: encode(keys.replicate),
    openrouter: encode(keys.openrouter),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encoded));
}

export function clearApiKey(provider: keyof ApiKeys): void {
  setApiKey(provider, '');
}

export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

async function testKey(provider: string): Promise<boolean> {
  try {
    const res = await fetch('/api/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    const data = await res.json();
    return data.valid === true;
  } catch {
    return false;
  }
}

export function testReplicateKey(_key?: string): Promise<boolean> {
  return testKey('replicate');
}

export function testOpenRouterKey(_key?: string): Promise<boolean> {
  return testKey('openrouter');
}

// LLM model preference
const LLM_MODEL_KEY = 'director-llm-model';
export const DEFAULT_LLM_MODEL = 'minimax/minimax-m2.7';

export function getSelectedModel(): string {
  if (typeof window === 'undefined') return DEFAULT_LLM_MODEL;
  return localStorage.getItem(LLM_MODEL_KEY) || DEFAULT_LLM_MODEL;
}

export function setSelectedModel(model: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LLM_MODEL_KEY, model);
}
