'use client';

import { useState, useEffect } from 'react';
import { getCachedImage, isIdbRef } from '@/lib/imageCache';

/**
 * Resolves an image URL that may be an IndexedDB reference (idb://key)
 * into a displayable data URL. For regular URLs, returns as-is.
 */
export function useCachedImage(url: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setResolved(null);
      return;
    }

    if (!isIdbRef(url)) {
      setResolved(url);
      return;
    }

    let cancelled = false;
    getCachedImage(url).then((dataUrl) => {
      if (!cancelled) setResolved(dataUrl);
    });

    return () => { cancelled = true; };
  }, [url]);

  return resolved;
}
