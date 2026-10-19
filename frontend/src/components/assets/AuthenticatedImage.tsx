import { useEffect, useState } from "react";

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
}

type ImageState = {
  src: string;
  objectUrl: string | null;
  failed: boolean;
};

export default function AuthenticatedImage({
  src,
  alt,
  className = "",
}: AuthenticatedImageProps) {
  const [imageState, setImageState] = useState<ImageState>({
    src: "",
    objectUrl: null,
    failed: false,
  });

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    const loadImage = async () => {
      try {
        const response = await fetch(src, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Image request failed (${response.status})`);
        }

        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
          throw new Error("The server did not return an image.");
        }

        createdUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setImageState({
            src,
            objectUrl: createdUrl,
            failed: false,
          });
        } else {
          URL.revokeObjectURL(createdUrl);
        }
      } catch (error) {
        console.error("Failed to load asset preview:", error);

        if (!cancelled) {
          setImageState({
            src,
            objectUrl: null,
            failed: true,
          });
        }
      }
    };

    void loadImage();

    return () => {
      cancelled = true;

      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [src]);

  const currentState = imageState.src === src ? imageState : null;

  if (currentState?.failed) {
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

  if (!currentState?.objectUrl) {
    return (
      <div
        aria-label={`Loading ${alt}`}
        className={`animate-pulse bg-slate-100 ${className}`}
      />
    );
  }

  return (
    <img
      src={currentState.objectUrl}
      alt={alt}
      className={className}
    />
  );
}