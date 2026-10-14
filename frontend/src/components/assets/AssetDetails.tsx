import type { Asset } from "../../types/asset";
import formatFileSize from "../../utils/formatFileSize";
import formatDate from "../../utils/formatDate";
import AssetTypeBadge from "./AssetTypeBadge";
import AssetStatusBadge from "./AssetStatusBadge";
import AssetMetadata from "./AssetMetadata";

interface AssetDetailsProps {
  asset: Asset;
}

export default function AssetDetails({ asset }: AssetDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Filename
        </p>
        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
          {asset.original_filename}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            File type
          </p>
          <div className="mt-2">
            <AssetTypeBadge mimeType={asset.mime_type} />
          </div>
          <p className="mt-1 break-all text-xs text-slate-500">
            {asset.mime_type || "Unknown"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
          </p>
          <div className="mt-2">
            <AssetStatusBadge status={asset.status} />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            File size
          </p>
          <p className="mt-1 text-sm text-slate-800">
            {formatFileSize(asset.file_size)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Uploaded
          </p>
          <p className="mt-1 text-sm text-slate-800">
            {formatDate(asset.created_at)}
          </p>
        </div>
      </div>

      {asset.metadata && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Media metadata
          </p>
          <AssetMetadata asset={asset} />
        </div>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Asset ID
        </p>
        <p className="mt-1 break-all font-mono text-xs text-slate-600">
          {asset.id}
        </p>
      </div>
    </div>
  );
}
