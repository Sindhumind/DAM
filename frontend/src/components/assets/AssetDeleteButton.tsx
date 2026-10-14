import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "../common/Button";
import Modal from "../common/Modal";

interface AssetDeleteButtonProps {
  filename: string;
  onDelete: () => void | Promise<void>;
  disabled?: boolean;
}

export default function AssetDeleteButton({
  filename,
  onDelete,
  disabled = false,
}: AssetDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    setError("");

    try {
      await onDelete();
      setIsOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete this asset.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        disabled={disabled}
        leftIcon={<Trash2 size={16} />}
        onClick={() => setIsOpen(true)}
      >
        Delete
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!deleting) {
            setIsOpen(false);
            setError("");
          }
        }}
        title="Delete asset?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete this asset?
              </p>

              <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">
                {filename}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                This action may be permanent.
              </p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={deleting}
              onClick={() => {
                setIsOpen(false);
                setError("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting..." : "Confirm delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
