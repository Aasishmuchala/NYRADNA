import { cacheImage } from './imageCache';

/**
 * Downloads an image from a URL and stores it in IndexedDB.
 * Returns an `idb://key` reference that survives page refresh.
 * This prevents expiring CDN URLs (like Replicate's) from breaking the app
 * WITHOUT overflowing localStorage (which has a 5-10MB limit).
 */
export async function persistImageUrl(url: string): Promise<string> {
  // Already persisted
  if (url.startsWith('idb://')) return url;

  // Already a local/relative URL — no conversion needed
  if (url.startsWith('/') || url.startsWith('blob:')) return url;

  // Store in IndexedDB (handles both data: URLs and remote URLs)
  return cacheImage(url);
}

/**
 * Persists a video URL by downloading and converting to a blob URL.
 * Videos are too large for IndexedDB, so we use blob URLs
 * which last for the browser session.
 */
export async function persistVideoUrl(url: string): Promise<string> {
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/') || url.startsWith('idb://')) return url;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('[persistVideoUrl] Failed to persist, keeping original URL:', err);
    return url;
  }
}
