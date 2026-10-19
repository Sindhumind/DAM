import type { Asset, AssetStats } from "../types/asset";
import {
  API_BASE_URL,
  REQUEST_OPTIONS,
  handleResponse,
} from "./apiResponse";

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
    `${API_BASE_URL}/api/assets?${params.toString()}`,
    REQUEST_OPTIONS,
  );

  const data = await handleResponse<PaginatedAssets>(response);

  if (
    !data ||
    !Array.isArray(data.assets) ||
    typeof data.total !== "number" ||
    typeof data.totalPages !== "number"
  ) {
    throw new Error(
      "The server returned an invalid assets response.",
    );
  }

  return data;
}

export interface UploadAssetMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export async function uploadAsset(
  file: File,
  metadata?: UploadAssetMetadata,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("files", file);

  if (metadata) {
    formData.append("metadata", JSON.stringify(metadata));
  }

  const response = await fetch(
    `${API_BASE_URL}/api/assets/upload`,
    {
      method: "POST",
      ...REQUEST_OPTIONS,
      body: formData,
    },
  );

  return handleResponse<unknown>(response);
}

export async function getAssetStats(): Promise<AssetStats> {
  const response = await fetch(
    `${API_BASE_URL}/api/assets/stats`,
    REQUEST_OPTIONS,
  );

  return handleResponse<AssetStats>(response);
}

export function getAssetPreviewUrl(assetId: number): string {
  return `${API_BASE_URL}/api/assets/${assetId}/preview`;
}

export function getAssetVideoUrl(assetId: number): string {
  return `${API_BASE_URL}/api/assets/${assetId}/video`;
}

export async function deleteAsset(assetId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/assets/${assetId}`,
    {
      method: "DELETE",
      ...REQUEST_OPTIONS,
    },
  );

  await handleResponse<{ message: string }>(response);
}

export async function updateAssetMetadata(
  assetId: number,
  metadata: Record<string, unknown>,
): Promise<Asset> {
  const response = await fetch(
    `${API_BASE_URL}/api/assets/${assetId}/metadata`,
    {
      method: "PATCH",
      ...REQUEST_OPTIONS,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    },
  );

  const data = await handleResponse<{
    message: string;
    asset: Asset;
  }>(response);

  if (!data?.asset) {
    throw new Error(
      "The server returned an invalid metadata response.",
    );
  }

  return data.asset;
}