/**
 * URL validation utilities to prevent SSRF attacks.
 * Validates user-supplied URLs before they are fetched server-side
 * or passed to external APIs (Replicate, OpenRouter).
 */

/** Domains known to serve Replicate prediction outputs */
const TRUSTED_DOMAINS = new Set([
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'replicate.com',
  'tjzk.replicate.delivery',
]);

/** Private/internal IP ranges that must never be fetched */
const PRIVATE_IP_PATTERNS = [
  /^127\./,                    // loopback
  /^10\./,                     // class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // class B private
  /^192\.168\./,               // class C private
  /^169\.254\./,               // link-local / AWS IMDS
  /^0\./,                      // "this" network
  /^fc00:/i,                   // IPv6 unique local
  /^fe80:/i,                   // IPv6 link-local
  /^::1$/,                     // IPv6 loopback
  /^fd/i,                      // IPv6 private
];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a URL is safe to fetch or pass to an external API.
 * Rejects private IPs, non-HTTPS, and suspicious schemes.
 *
 * @param url - The URL to validate
 * @param options.allowHttp - Allow http:// (default: false, only https)
 * @param options.allowDataUri - Allow data: URIs (default: false)
 * @param options.trustedOnly - Only allow TRUSTED_DOMAINS (default: false)
 */
export function validateUrl(
  url: string,
  options?: { allowHttp?: boolean; allowDataUri?: boolean; trustedOnly?: boolean },
): UrlValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  // Allow data URIs if explicitly enabled (cap at 10MB to prevent memory pressure)
  if (trimmed.startsWith('data:')) {
    if (!options?.allowDataUri) {
      return { valid: false, error: 'data: URIs are not allowed' };
    }
    const MAX_DATA_URI_BYTES = 10 * 1024 * 1024; // 10MB
    if (trimmed.length > MAX_DATA_URI_BYTES) {
      return { valid: false, error: `data: URI exceeds ${MAX_DATA_URI_BYTES / 1024 / 1024}MB limit` };
    }
    return { valid: true };
  }

  // Block dangerous schemes
  const scheme = trimmed.split(':')[0]?.toLowerCase();
  const allowedSchemes = options?.allowHttp ? ['https', 'http'] : ['https'];
  if (!allowedSchemes.includes(scheme)) {
    return { valid: false, error: `Scheme '${scheme}' is not allowed. Use ${allowedSchemes.join(' or ')}.` };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Block private/internal hostnames
  const hostname = parsed.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname === '') {
    return { valid: false, error: 'localhost is not allowed' };
  }

  // Check for IP-based hostnames against private ranges
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Private/internal IP addresses are not allowed' };
    }
  }

  // Trusted-only mode: only allow known safe domains
  if (options?.trustedOnly) {
    const domain = hostname.replace(/^www\./, '');
    const isTrusted = TRUSTED_DOMAINS.has(domain) ||
      Array.from(TRUSTED_DOMAINS).some(d => domain.endsWith(`.${d}`));
    if (!isTrusted) {
      return { valid: false, error: `Domain '${hostname}' is not in the trusted list` };
    }
  }

  return { valid: true };
}

/**
 * Validate an array of URLs. Returns the first error found, or valid.
 */
export function validateUrls(
  urls: string[],
  options?: Parameters<typeof validateUrl>[1],
): UrlValidationResult {
  for (let i = 0; i < urls.length; i++) {
    const result = validateUrl(urls[i], options);
    if (!result.valid) {
      return { valid: false, error: `URL at index ${i}: ${result.error}` };
    }
  }
  return { valid: true };
}
