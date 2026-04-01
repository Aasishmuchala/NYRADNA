/**
 * Downloads an image from a URL and converts it to a base64 data URL.
 * This prevents expiring CDN URLs (like Replicate's) from breaking the app.
 * The data URL is stored in wizard state which persists to localStorage.
 */
export async function persistImageUrl(url: string): Promise<string> {
  // Already a data URL — no conversion needed
  if (url.startsWith('data:')) return url;

  // Already a local/relative URL — no conversion needed
  if (url.startsWith('/') || url.startsWith('blob:')) return url;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert to data URL'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[persistImageUrl] Failed to persist, keeping original URL:', err);
    return url; // Fallback — return original URL if conversion fails
  }
}

/**
 * Persists a video URL by downloading and converting to a blob URL.
 * Videos are too large for data URLs in localStorage, so we use blob URLs
 * which last for the browser session.
 */
export async function persistVideoUrl(url: string): Promise<string> {
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) return url;

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
