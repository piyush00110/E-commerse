'use client';

import Image from 'next/image';
import { useState } from 'react';

/** Inline SVG used when a product has no image or the remote image fails. */
export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="#eef1f5">' +
      '<rect width="400" height="400"/>' +
      '<text x="200" y="208" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="16">No Image</text>' +
      '</svg>',
  );

interface ProductImageProps {
  src?: string | null;
  alt: string;
  /** Use fill mode inside a positioned parent. */
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover';
  onClick?: React.MouseEventHandler<HTMLElement>;
}

/**
 * Shared product image.
 *
 * - Uses `next/image` so images are resized, served as AVIF/WebP and lazy
 *   loaded by default (big LCP/bandwidth win over raw `<img>`).
 * - Falls back to a local placeholder when the source is missing or errors.
 * - Data URLs (the placeholder) bypass the optimizer.
 */
export default function ProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  priority = false,
  className,
  style,
  objectFit = 'contain',
  onClick,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? IMAGE_PLACEHOLDER : src;

  if (resolved.startsWith('data:')) {
    const baseStyle: React.CSSProperties = fill
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit }
      : { width: width ?? '100%', height: height ?? 'auto', objectFit };
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        className={className}
        style={{ ...baseStyle, ...style }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onClick={onClick}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes || '100vw'}
        priority={priority}
        className={className}
        style={{ objectFit, ...style }}
        onError={() => setFailed(true)}
        onClick={onClick}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      width={width || 400}
      height={height || 400}
      sizes={sizes}
      priority={priority}
      className={className}
      style={{ objectFit, ...style }}
      onError={() => setFailed(true)}
      onClick={onClick}
    />
  );
}
