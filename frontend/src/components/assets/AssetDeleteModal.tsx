import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Asset } from "../../types/asset";

interface DeleteAssetModalProps {
  asset: Asset | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteAssetModal({
  asset,
  deleting,
  onCancel,
  onConfirm,
}: DeleteAssetModalProps) {
  if (!asset) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="text-red-600" size={24} />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            aria-label="Close confirmation dialog"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delete-modal-title"
          className="mt-4 text-lg font-semibold text-slate-900"
        >
          Delete asset?
        </h2>

        <p
          id="delete-modal-description"
          className="mt-2 text-sm leading-6 text-slate-600"
        >
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800">
            {asset.original_filename}
          </span>
          ? The original file and thumbnail will be removed. This action cannot
          be undone.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete asset"}
          </button>
        </div>
      </div>
    </div>
  );
}
