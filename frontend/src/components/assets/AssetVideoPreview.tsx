import { useEffect, useRef, useState } from "react";

interface Props {
  mediaUrl: string;
  captionUrl?: string;
  title?: string;
}

const EMPTY_VTT_DATA_URI =
  "data:text/vtt;charset=utf-8,WEBVTT%0A%0A";

export default function AssetVideoPreview({
  mediaUrl,
  captionUrl,
  title = "Asset video preview",
}: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case " ":
        case "k": {
          // Avoid double-toggling if native <video> already handles Space when focused
          if (event.key === " " && document.activeElement === video) return;
          event.preventDefault();
          if (video.paused) {
            void video.play();
            setAnnouncement("Video playing");
          } else {
            video.pause();
            setAnnouncement("Video paused");
          }
          break;
        }
        case "arrowleft": {
          if (document.activeElement === video) return;
          event.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          setAnnouncement(`Rewound 5 seconds to ${Math.round(video.currentTime)}s`);
          break;
        }
        case "arrowright": {
          if (document.activeElement === video) return;
          event.preventDefault();
          video.currentTime = Math.min(
            Number.isFinite(video.duration) ? video.duration : video.currentTime + 5,
            video.currentTime + 5,
          );
          setAnnouncement(`Fast-forwarded 5 seconds to ${Math.round(video.currentTime)}s`);
          break;
        }
        case "arrowup": {
          event.preventDefault();
          const nextVolUp = Math.min(1, Number((video.volume + 0.1).toFixed(2)));
          video.volume = nextVolUp;
          if (video.muted && nextVolUp > 0) video.muted = false;
          setAnnouncement(`Volume ${Math.round(nextVolUp * 100)}%`);
          break;
        }
        case "arrowdown": {
          event.preventDefault();
          const nextVolDown = Math.max(0, Number((video.volume - 0.1).toFixed(2)));
          video.volume = nextVolDown;
          setAnnouncement(`Volume ${Math.round(nextVolDown * 100)}%`);
          break;
        }
        case "m": {
          event.preventDefault();
          video.muted = !video.muted;
          setAnnouncement(video.muted ? "Muted" : "Unmuted");
          break;
        }
        case "f": {
          event.preventDefault();
          if (document.fullscreenElement) {
            void document.exitFullscreen();
          } else {
            void video.requestFullscreen?.();
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [videoUrl]);

  if (error) {
    return (
      <p role="alert" className="p-6 text-center text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (!videoUrl) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="p-6 text-sm text-white"
      >
        Loading video...
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col items-center">
      <video
        ref={videoRef}
        key={videoUrl}
        src={videoUrl}
        aria-label={title}
        controls
        autoPlay
        className="max-h-[60vh] w-full object-contain"
      >
        <track
          kind="captions"
          src={captionUrl || EMPTY_VTT_DATA_URI}
          srcLang="en"
          label="English captions"
          default
        />
        Your browser does not support video playback.
      </video>

      <p className="w-full bg-slate-900 px-3 py-1.5 text-center text-xs text-slate-300">
        Shortcuts: <kbd className="rounded bg-slate-800 px-1.5 py-0.5">Space</kbd>/
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5">K</kbd> Play/Pause ·{" "}
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5">←</kbd>/
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5">→</kbd> Seek 5s ·{" "}
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5">↑</kbd>/
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5">↓</kbd> Volume ·{" "}
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5">M</kbd> Mute
      </p>

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}