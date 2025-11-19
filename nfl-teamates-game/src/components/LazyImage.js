import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@mui/material';

/**
 * LazyImage component with IntersectionObserver for optimal performance
 * Loads images only when they're about to enter the viewport
 */
export function LazyImage({ src, alt, width, height, style, className, onLoad }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div ref={imgRef} style={{ position: 'relative', width, height, ...style }}>
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width={width || '100%'}
          height={height || 200}
          animation="wave"
        />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={{
            ...style,
            display: isLoaded ? 'block' : 'none',
            width: '100%',
            height: 'auto',
          }}
          className={className}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}

/**
 * Optimizes ESPN player headshot URLs for better performance
 * ESPN allows size parameters in their image URLs
 */
export function optimizePlayerImageUrl(url, size = 200) {
  if (!url || !url.includes('espncdn.com')) {
    return url;
  }

  // ESPN combiner supports width/height parameters
  // Example: &w=200&h=200 for 200x200 images
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${size}&h=${size}&scale=crop`;
}

export default LazyImage;
