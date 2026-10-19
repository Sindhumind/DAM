import { useRef } from "react";
import { Upload } from "lucide-react";
import Button from "../common/Button";
import { ACCEPTED_FILE_EXTENSIONS } from "../../utils/fileValidation";

interface UploadDropzoneProps {
  uploading: boolean;
  isDragging: boolean;
  onSelect: (file?: File) => void;
  onDraggingChange: (dragging: boolean) => void;
  onError: (message: string) => void;
}

export default function UploadDropzone({
  uploading,
  isDragging,
  onSelect,
  onDraggingChange,
  onError,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS}
        disabled={uploading}
        onChange={(event) => {
          onSelect(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
        className="hidden"
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) onDraggingChange(true);
        }}
        onDragLeave={(event) => {
          if (
            !event.currentTarget.contains(
              event.relatedTarget as Node | null,
            )
          ) {
            onDraggingChange(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDraggingChange(false);

          if (uploading) return;

          const files = Array.from(event.dataTransfer.files);

          if (files.length > 1) {
            onError("Please select only one file at a time.");
          } else {
            onSelect(files[0]);
          }
        }}
        className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-300 bg-slate-50 hover:border-indigo-300"
        }`}
      >
        <Upload size={30} className="mx-auto text-indigo-500" />

        <p className="mt-2 text-sm font-semibold text-slate-800">
          {isDragging
            ? "Drop your file here"
            : "Drag and drop a file here"}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          JPG, PNG, WEBP, MP4, MOV, WEBM · One file · Max 500 MB
        </p>

        <Button
          type="button"
          variant="secondary"
          leftIcon={<Upload size={15} />}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-3"
        >
          Browse files
        </Button>
      </div>
    </>
  );
}