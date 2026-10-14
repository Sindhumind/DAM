
import type { Asset, AssetStats } from "../types/asset";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface PaginatedAssets {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AssetTypeFilter = "all" | "image" | "video";

export interface GetAssetsParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: AssetTypeFilter;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;

    try {
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const result = await response.json();
        message = result.message || message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("The server returned an unexpected response.");
  }

  return (await response.json()) as T;
}

export async function getAssets({
  page = 1,
  limit = 8,
  search = "",
  filter = "all",
}: GetAssetsParams = {}): Promise<PaginatedAssets> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
    filter,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/assets?${params.toString()}`
  );

  const data = await handleResponse<PaginatedAssets>(response);

  if (
    !data ||
    !Array.isArray(data.assets) ||
    typeof data.total !== "number" ||
    typeof data.totalPages !== "number"
  ) {
    throw new Error("The server returned an invalid assets response.");
  }

  return data;
}

export async function uploadAsset(file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append("files", file);

  const response = await fetch(`${API_BASE_URL}/api/assets/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<unknown>(response);
}

export async function getAssetStats(): Promise<AssetStats> {
  const response = await fetch(`${API_BASE_URL}/api/assets/stats`);
  return handleResponse<AssetStats>(response);
}

export function getAssetPreviewUrl(assetId: number): string {
  return `${API_BASE_URL}/api/assets/${assetId}/preview`;
}

export function getAssetVideoUrl(assetId: number): string {
  return `${API_BASE_URL}/api/assets/${assetId}/video`;
}

export async function deleteAsset(assetId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
    method: "DELETE",
  });

  await handleResponse<{ message: string }>(response);
}
