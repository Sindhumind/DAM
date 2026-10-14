import { Copy, Eye, MoreVertical } from "lucide-react";
import { useState } from "react";
import Button from "../common/Button";

interface AssetActionsProps {
  filename: string;
  onPreview: () => void;
}

export default function AssetActions({
  filename,
  onPreview,
}: AssetActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(filename);
      setCopyMessage("Filename copied");
    } catch {
      setCopyMessage("Unable to copy filename");
    }

    setIsOpen(false);
    window.setTimeout(() => setCopyMessage(""), 2000);
  };

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="ghost"
        aria-label="Asset actions"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="p-2!"
      >
        <MoreVertical size={18} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onPreview();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye size={16} />
            Preview
          </button>

          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <Copy size={16} />
            Copy filename
          </button>
        </div>
      )}

      {copyMessage && (
        <p
          role="status"
          className="absolute right-0 mt-1 whitespace-nowrap text-xs text-slate-600"
        >
          {copyMessage}
        </p>
      )}
    </div>
  );
}
