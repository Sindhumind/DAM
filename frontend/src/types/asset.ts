export interface Asset {
  id: number;
  original_filename: string;
  mime_type: string;
  file_size: number | string;
  storage_key: string;
  status: string;
  created_at: string;
  uploaded_by?: number | null;
  metadata?: {
    thumbnailKey?: string;
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: unknown;
  } | null;
}

export interface AssetStats {
  totalAssets: number;
  imageCount: number;
  videoCount: number;
  totalStorageBytes: number;
}

export type AssetFilter = "all" | "image" | "video";

export type ViewMode = "grid" | "list";