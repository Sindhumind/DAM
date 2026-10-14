import Modal from "../common/Modal";
import type { Asset } from "../../types/asset";
import AssetDetails from "./AssetDetails";

interface AssetDetailsModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssetDetailsModal({
  asset,
  isOpen,
  onClose,
}: AssetDetailsModalProps) {
  if (!asset) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset details" size="md">
      <div className="space-y-5">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="wrap-break-word text-base font-semibold text-slate-900">
            {asset.original_filename}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Information about this asset
          </p>
        </div>

        <AssetDetails asset={asset} />

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
