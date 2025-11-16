'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative overflow-hidden">
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        onError={() => {
          setImgSrc(fallbackSrc);
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        className={`${props.className || ''} ${
          isLoading ? 'blur-sm scale-105' : 'blur-0 scale-100'
        } transition-all duration-300`}
        loading={props.loading || 'lazy'}
        quality={props.quality || 85}
      />
    </div>
  );
}
