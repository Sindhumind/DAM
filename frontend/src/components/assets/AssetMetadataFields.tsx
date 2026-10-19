export interface EditableMetadata {
  title: string;
  description: string;
  category: string;
  tags: string;
}

interface Props {
  form: EditableMetadata;
  onChange: (field: keyof EditableMetadata, value: string) => void;
}

export default function AssetMetadataFields({ form, onChange }: Props) {
  return (
    <>
      <label className="block text-sm font-medium text-slate-700">
        Title
        <input
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          maxLength={150}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          maxLength={2000}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Category
        <input
          value={form.category}
          onChange={(event) => onChange("category", event.target.value)}
          maxLength={150}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Tags
        <input
          value={form.tags}
          onChange={(event) => onChange("tags", event.target.value)}
          placeholder="marketing, campaign, logo"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Separate tags with commas. Maximum 20 tags.
        </span>
      </label>
    </>
  );
}
