import { useState } from "react";
import type { Asset } from "../../types/asset";
import { updateAssetMetadata } from "../../services/assetService";
import AssetMetadataFields, {
  type EditableMetadata,
} from "./AssetMetadataFields";

interface Props {
  asset: Asset;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssetMetadataEditor({
  asset,
  onClose,
  onSaved,
}: Props) {
  const metadata = asset.metadata ?? {};

  const [form, setForm] = useState<EditableMetadata>({
    title:
      typeof metadata.title === "string"
        ? metadata.title
        : asset.original_filename,
    description:
      typeof metadata.description === "string" ? metadata.description : "",
    category: typeof metadata.category === "string" ? metadata.category : "",
    tags: Array.isArray(metadata.tags)
      ? metadata.tags
          .filter((tag): tag is string => typeof tag === "string")
          .join(", ")
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof EditableMetadata, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (form.title.length > 150 || form.category.length > 150) {
      setError("Title and category must be 150 characters or fewer.");
      return;
    }
    if (form.description.length > 2000) {
      setError("Description must be 2000 characters or fewer.");
      return;
    }
    if (tags.length > 20 || tags.some((tag) => tag.length > 50)) {
      setError("Use up to 20 tags, each no longer than 50 characters.");
      return;
    }

    setSaving(true);
    try {
      await updateAssetMetadata(asset.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        tags,
      });
      onClose();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save metadata.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl"
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Edit asset metadata
          </h2>
          <p className="mt-1 wrap-break-word text-sm text-slate-500">
            {asset.original_filename}
          </p>
        </div>

        <AssetMetadataFields form={form} onChange={handleChange} />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save metadata"}
          </button>
        </div>
      </form>
    </div>
  );
}
