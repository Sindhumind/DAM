// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import AssetFilters from "./AssetFilters";

describe("AssetFilters", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders search input with accessible label and debounces search queries by 300ms", () => {
        const onSearchChange = vi.fn();
        const onFilterChange = vi.fn();

        render(
            <AssetFilters
                searchValue=""
                onSearchChange={onSearchChange}
                activeFilter="all"
                onFilterChange={onFilterChange}
            />,
        );

        const searchInput = screen.getByLabelText("Search assets by filename");
        fireEvent.change(searchInput, { target: { value: "banner" } });

        expect(onSearchChange).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);

        expect(onSearchChange).toHaveBeenCalledTimes(1);
        expect(onSearchChange).toHaveBeenCalledWith("banner");
    });

    it("calls onFilterChange when clicking media type filter buttons", () => {
        const onSearchChange = vi.fn();
        const onFilterChange = vi.fn();

        render(
            <AssetFilters
                searchValue=""
                onSearchChange={onSearchChange}
                activeFilter="all"
                onFilterChange={onFilterChange}
            />,
        );

        const videosButton = screen.getByRole("button", { name: "Videos" });
        expect(videosButton).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(videosButton);

        expect(onFilterChange).toHaveBeenCalledWith("video");
    });
});
