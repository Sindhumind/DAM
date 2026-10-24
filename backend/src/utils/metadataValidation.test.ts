import { describe, it, expect } from "vitest";
import { validateAssetMetadata } from "./metadataValidation";

describe("validateAssetMetadata", () => {
  it("accepts valid metadata", () => {
    expect(() =>
      validateAssetMetadata({
        title: "Product photo",
        description: "A product image",
        category: "Products",
        tags: ["product", "photo"],
      }),
    ).not.toThrow();
  });

  it("rejects empty metadata", () => {
    expect(() => validateAssetMetadata({ })).toThrow(
      "At least one metadata field is required.",
    );
  });

  it("rejects unknown fields", () => {
    expect(() =>
      validateAssetMetadata({ admin: true }),
    ).toThrow("is not allowed.");
  });

  it("rejects more than 20 tags", () => {
    expect(() =>
      validateAssetMetadata({
        tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
      }),
    ).toThrow("Tags must be an array");
  });

  it("rejects tags longer than 50 characters", () => {
    expect(() =>
      validateAssetMetadata({ tags: ["x".repeat(51)] }),
    ).toThrow("Tags must be an array");
  });

  it("rejects titles longer than 150 characters", () => {
    expect(() =>
      validateAssetMetadata({ title: "x".repeat(151) }),
    ).toThrow("Invalid value for metadata field 'title'.");
  });

  it("rejects descriptions longer than 2000 characters", () => {
    expect(() =>
      validateAssetMetadata({
        description: "x".repeat(2001),
      }),
    ).toThrow("Invalid value for metadata field 'description'.");
  });
});