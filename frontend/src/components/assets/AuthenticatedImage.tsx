import { useState } from "react";

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function AuthenticatedImage({
  src,
  alt,
  className = "",
}: AuthenticatedImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const failed = failedSrc === src;
  const loaded = loadedSrc === src;

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} preview unavailable`}
        className={`flex items-center justify-center bg-slate-100 text-xs text-slate-500 ${className}`}
      >
        Preview unavailable
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div
          aria-label={`Loading ${alt}`}
          className={`animate-pulse bg-slate-100 ${className}`}
        />
      )}
      <img
        src={src}
        alt={alt}
        crossOrigin="use-credentials"
        loading="lazy"
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        className={`${className} ${loaded ? "" : "hidden"}`}
      />
    </>
  );
}