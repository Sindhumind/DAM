// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useAssets from "./useAssets";
import * as assetService from "../services/assetService";

vi.mock("../services/assetService", () => ({
  getAssets: vi.fn(),
}));

describe("useAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches initial assets and resets page to 1 when filter changes", async () => {
    vi.mocked(assetService.getAssets).mockResolvedValue({
      assets: [],
      total: 20,
      page: 1,
      limit: 8,
      totalPages: 3,
    });

    const { result } = renderHook(() => useAssets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(assetService.getAssets).toHaveBeenCalledWith({
      page: 1,
      limit: 8,
      search: "",
      filter: "all",
    });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });

    act(() => {
      result.current.setFilter("image");
    });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(result.current.filter).toBe("image");
    });
  });
});