import AuthenticatedImage from "./AuthenticatedImage";
import AssetVideoPreview from "./AssetVideoPreview";

interface Props {
  isVideo: boolean;
  mediaUrl: string;
  filename: string;
}

export default function AssetPreviewMedia({
  isVideo,
  mediaUrl,
  filename,
}: Props) {
  return (
    <div className="flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-lg bg-slate-950">
      {isVideo ? (
        <AssetVideoPreview key={mediaUrl} mediaUrl={mediaUrl} />
      ) : (
        <AuthenticatedImage
          src={mediaUrl}
          alt={filename}
          className="max-h-[65vh] w-full object-contain"
        />
      )}
    </div>
  );
}
