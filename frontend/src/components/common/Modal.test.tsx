// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import Modal from "./Modal";

describe("Modal", () => {
    it("renders accessible dialog and calls onClose when Escape is pressed", () => {
        const onClose = vi.fn();

        render(
            <Modal isOpen={true} onClose={onClose} title="Upload assets">
                <button type="button">Action</button>
            </Modal>,
        );

        const dialog = screen.getByRole("dialog", { name: "Upload assets" });
        expect(dialog).toHaveAttribute("aria-modal", "true");

        fireEvent.keyDown(document, { key: "Escape" });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not render when isOpen is false", () => {
        render(
            <Modal isOpen={false} onClose={vi.fn()} title="Hidden modal">
                <p>Content</p>
            </Modal>,
        );

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});