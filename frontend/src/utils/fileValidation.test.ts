import { describe, it, expect } from "vitest";
import {
  validateFile,
  MAX_FILE_SIZE,
} from "./fileValidation";

describe("validateFile", () => {
  it("accepts a valid JPEG file", () => {
    const file = new File(["image"], "photo.jpg", {
      type: "image/jpeg",
    });

    expect(validateFile(file)).toBeNull();
  });

  it("rejects unsupported file types", () => {
    const file = new File(["text"], "document.txt", {
      type: "text/plain",
    });

    expect(validateFile(file)).toBe(
      "Unsupported file type. Upload JPG, PNG, WEBP, MP4, MOV, or WEBM files.",
    );
  });

  it("rejects empty files", () => {
    const file = new File([], "empty.jpg", {
      type: "image/jpeg",
    });

    expect(validateFile(file)).toBe(
      "The selected file is empty.",
    );
  });

  it("rejects files larger than 500 MB", () => {
    const file = {
      name: "large.jpg",
      type: "image/jpeg",
      size: MAX_FILE_SIZE + 1,
    } as File;

    expect(validateFile(file)).toBe(
      "File size must not exceed 500 MB.",
    );
  });

  it("accepts a file exactly 500 MB", () => {
    const file = {
      name: "maximum.jpg",
      type: "image/jpeg",
      size: MAX_FILE_SIZE,
    } as File;

    expect(validateFile(file)).toBeNull();
  });
});