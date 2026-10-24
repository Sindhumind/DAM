const ALLOWED_METADATA_FIELDS = new Set([
  "title",
  "description",
  "tags",
  "category",
]);

export function validateAssetMetadata(metadata: object): void {
  const entries = Object.entries(
    metadata as Record<string, unknown>,
  );

  if (entries.length === 0) {
    throw new Error("At least one metadata field is required.");
  }

  for (const [key, value] of entries) {
    if (!ALLOWED_METADATA_FIELDS.has(key)) {
      throw new Error(`Metadata field '${key}' is not allowed.`);
    }

    if (key === "tags") {
      if (
        !Array.isArray(value) ||
        value.length > 20 ||
        !value.every(
          (tag) =>
            typeof tag === "string" &&
            tag.trim().length > 0 &&
            tag.trim().length <= 50,
        )
      ) {
        throw new Error(
          "Tags must be an array of up to 20 non-empty strings, each no longer than 50 characters.",
        );
      }
    } else if (
      typeof value !== "string" ||
      value.length > (key === "description" ? 2000 : 150)
    ) {
      throw new Error(`Invalid value for metadata field '${key}'.`);
    }
  }
}