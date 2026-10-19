export interface UploadMetadata {
  title: string;
  description: string;
  category: string;
  tags: string;
}

interface UploadMetadataFormProps {
  metadata: UploadMetadata;
  uploading: boolean;
  onChange: (field: keyof UploadMetadata, value: string) => void;
}

export default function UploadMetadataForm({
  metadata,
  uploading,
  onChange,
}: UploadMetadataFormProps) {
  return (
    <div className="mt-5 space-y-4">
      <h3 className="text-base font-semibold text-slate-900">
        Asset metadata
      </h3>

      <label className="block text-sm font-medium text-slate-700">
        Title *
        <input
          value={metadata.title}
          onChange={(event) => onChange("title", event.target.value)}
          maxLength={150}
          disabled={uploading}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea
          value={metadata.description}
          onChange={(event) => onChange("description", event.target.value)}
          maxLength={2000}
          rows={3}
          disabled={uploading}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Category
        <input
          value={metadata.category}
          onChange={(event) => onChange("category", event.target.value)}
          maxLength={150}
          disabled={uploading}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Tags
        <input
          value={metadata.tags}
          onChange={(event) => onChange("tags", event.target.value)}
          placeholder="marketing, campaign, logo"
          disabled={uploading}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Separate tags with commas. Maximum 20 tags.
        </span>
      </label>
    </div>
  );
}