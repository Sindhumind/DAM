import { CheckCircle, Upload } from "lucide-react";
import Button from "../common/Button";

interface UploadModalFooterProps {
  uploading: boolean;
  hasFile: boolean;
  onCancel: () => void;
  onUpload: () => void;
}

export default function UploadModalFooter({
  uploading,
  hasFile,
  onCancel,
  onUpload,
}: UploadModalFooterProps) {
  return (
    <>
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="button"
          loading={uploading}
          disabled={!hasFile || uploading}
          onClick={onUpload}
          leftIcon={<Upload size={17} />}
        >
          {uploading ? "Uploading..." : "Upload file"}
        </Button>
      </div>

      {uploading && (
        <p className="mt-3 text-center text-xs text-slate-500">
          <CheckCircle size={14} className="mr-1 inline" />
          Upload in progress. Please keep this window open.
        </p>
      )}
    </>
  );
}