'use client';

import { useCachedImage } from '@/hooks/useCachedImage';

interface CachedImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
}

/**
 * Image component that resolves IndexedDB references (idb://key) to displayable URLs.
 * Drop-in replacement for <img> when images may be cached in IndexedDB.
 */
export function CachedImg({ src, alt, ...props }: CachedImgProps) {
  const resolved = useCachedImage(src);

  if (!resolved) {
    return (
      <div className={props.className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined text-on-surface-variant/20 text-2xl">image</span>
      </div>
    );
  }

  return <img src={resolved} alt={alt ?? ''} {...props} />;
}
