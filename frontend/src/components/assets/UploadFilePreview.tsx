import { useEffect, useRef } from "react";
import { File as FileIcon } from "lucide-react";

interface UploadFilePreviewProps {
  file: File;
}

export default function UploadFilePreview({
  file,
}: UploadFilePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const image = document.createElement("img");
      image.src = url;
      image.alt = file.name;
      image.className = "h-full w-full object-contain";
      container.replaceChildren(image);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      video.className = "h-full w-full object-contain";
      container.replaceChildren(video);
    }

    return () => {
      URL.revokeObjectURL(url);
      container.replaceChildren();
    };
  }, [file]);

  return (
    <div
      ref={previewRef}
      className="flex h-full w-full items-center justify-center"
    >
      {!file.type.startsWith("image/") &&
        !file.type.startsWith("video/") && (
          <FileIcon size={24} className="text-slate-400" />
        )}
    </div>
  );
}
