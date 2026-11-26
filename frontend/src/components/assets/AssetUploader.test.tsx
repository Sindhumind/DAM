// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import AssetUploader from "./AssetUploader";
import * as assetService from "../../services/assetService";

vi.mock("../../services/assetService", () => ({
    uploadAsset: vi.fn(),
}));

describe("AssetUploader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("allows selecting a file, auto-populates title, and uploads successfully", async () => {
        const onUploadComplete = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();
        vi.mocked(assetService.uploadAsset).mockResolvedValueOnce({ id: 1 });

        render(
            <AssetUploader
                onUploadComplete={onUploadComplete}
                onClose={onClose}
            />,
        );

        expect(
            screen.getByRole("dialog", { name: "Upload assets" }),
        ).toBeInTheDocument();

        const fileInput = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;
        const sampleFile = new File(["image-bytes"], "hero-banner.png", {
            type: "image/png",
        });

        fireEvent.change(fileInput, { target: { files: [sampleFile] } });

        expect(await screen.findByText("hero-banner.png")).toBeInTheDocument();

        const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
        expect(titleInput.value).toBe("hero-banner");

        const uploadButton = screen.getByRole("button", { name: /^upload/i });
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(assetService.uploadAsset).toHaveBeenCalledTimes(1);
            expect(onUploadComplete).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});