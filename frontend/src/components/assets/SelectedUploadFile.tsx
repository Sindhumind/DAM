import { Trash2 } from "lucide-react";
import formatFileSize from "../../utils/formatFileSize";
import UploadFilePreview from "./UploadFilePreview";

interface SelectedUploadFileProps {
  file: File;
  uploading: boolean;
  onRemove: () => void;
}

export default function SelectedUploadFile({
  file,
  uploading,
  onRemove,
}: SelectedUploadFileProps) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
        <UploadFilePreview file={file} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700">
          {file.name}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {formatFileSize(file.size)}
        </p>
      </div>

      <button
        type="button"
        title="Remove file"
        aria-label="Remove selected file"
        disabled={uploading}
        onClick={onRemove}
        className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}