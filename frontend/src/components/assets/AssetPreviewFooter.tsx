import { Download, X } from "lucide-react";
import Button from "../common/Button";
import type { Asset } from "../../types/asset";

interface Props {
  asset: Asset;
  onDownload: () => void;
  onClose: () => void;
}

export default function AssetPreviewFooter({
  asset,
  onDownload,
  onClose,
}: Props) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {asset.original_filename}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {asset.mime_type} · {asset.status}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          leftIcon={<Download size={16} />}
          onClick={onDownload}
        >
          Download
        </Button>
        <Button
          type="button"
          variant="ghost"
          leftIcon={<X size={16} />}
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
