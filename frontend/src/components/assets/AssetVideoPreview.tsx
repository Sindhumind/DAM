import { useEffect, useState } from "react";

interface Props {
  mediaUrl: string;
}

export default function AssetVideoPreview({ mediaUrl }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    async function loadVideo() {
      try {
        const response = await fetch(mediaUrl, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Unable to load video (${response.status}).`);
        }

        const blob = await response.blob();

        if (!blob.type.startsWith("video/")) {
          throw new Error("The server did not return a video file.");
        }

        objectUrl = URL.createObjectURL(blob);

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
        } else {
          setVideoUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load video.",
          );
        }
      }
    }

    void loadVideo();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaUrl]);

  if (error) {
    return <p className="p-6 text-center text-sm text-red-300">{error}</p>;
  }

  if (!videoUrl) {
    return <p className="p-6 text-sm text-white">Loading video...</p>;
  }

  return (
    <video
      key={videoUrl}
      src={videoUrl}
      controls
      autoPlay
      className="max-h-[65vh] w-full object-contain"
    >
      Your browser does not support video playback.
    </video>
  );
}
