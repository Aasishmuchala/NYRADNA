/**
 * Runtime environment variable validation.
 * Import and call `validateEnv()` at the top of API routes or in server-side code.
 */

interface EnvConfig {
  REPLICATE_API_TOKEN: string;
  REPLICATE_USERNAME: string;
  OPENROUTER_API_KEY?: string;
  OPENAI_API_KEY?: string;
  VIDEO_LORA_PASSWORD?: string;
  REPLICATE_WEBHOOK_SECRET?: string;
}

let _validated = false;
let _cache: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (_validated && _cache) return _cache;

  const token = process.env.REPLICATE_API_TOKEN;
  const username = process.env.REPLICATE_USERNAME;

  if (!token) {
    throw new Error('Missing required environment variable: REPLICATE_API_TOKEN');
  }
  if (!username) {
    throw new Error('Missing required environment variable: REPLICATE_USERNAME');
  }

  _cache = {
    REPLICATE_API_TOKEN: token,
    REPLICATE_USERNAME: username,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    VIDEO_LORA_PASSWORD: process.env.VIDEO_LORA_PASSWORD,
    REPLICATE_WEBHOOK_SECRET: process.env.REPLICATE_WEBHOOK_SECRET,
  };
  _validated = true;
  return _cache;
}

/** Get a specific required env var or throw. */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
