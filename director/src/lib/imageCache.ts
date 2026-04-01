/**
 * IndexedDB-based image cache for persisting generated images.
 * localStorage has a 5-10MB limit — base64 images overflow it.
 * IndexedDB has hundreds of MB available.
 *
 * Usage:
 *   const url = await cacheImage(replicateUrl); // returns idb://hash key
 *   const dataUrl = await getCachedImage('idb://hash'); // returns base64 data URL
 */

const DB_NAME = 'director-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Generate a simple hash key from a URL.
 */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return `img_${Math.abs(hash).toString(36)}`;
}

/**
 * Download an image and store it in IndexedDB.
 * Returns an `idb://key` reference that can be resolved later.
 */
export async function cacheImage(url: string): Promise<string> {
  // Already cached or local
  if (url.startsWith('idb://') || url.startsWith('blob:')) return url;
  if (url.startsWith('data:')) {
    // Already a data URL — store it in IDB to free localStorage
    const key = hashUrl(url.slice(0, 100) + url.length);
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(url, key);
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
      db.close();
      return `idb://${key}`;
    } catch {
      return url; // fallback
    }
  }

  // Download from remote URL
  try {
    const res = await fetch(url);
    if (!res.ok) return url;

    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const key = hashUrl(url);
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(dataUrl, key);
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    db.close();

    return `idb://${key}`;
  } catch (err) {
    console.warn('[imageCache] Failed to cache image:', err);
    return url; // fallback to original URL
  }
}

/**
 * Resolve an `idb://key` reference back to a data URL.
 * For non-idb URLs, returns as-is.
 */
export async function getCachedImage(ref: string): Promise<string> {
  if (!ref.startsWith('idb://')) return ref;

  const key = ref.slice(6);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const result = await new Promise<string | undefined>((resolve, reject) => {
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result as string | undefined);
      req.onerror = reject;
    });
    db.close();
    return result ?? ref;
  } catch {
    return ref;
  }
}

/**
 * Check if a URL is an IDB reference that needs resolving.
 */
export function isIdbRef(url: string): boolean {
  return url.startsWith('idb://');
}

/**
 * Clear all cached images.
 */
export async function clearImageCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    db.close();
  } catch {
    // ignore
  }
}
