import {
  getRabbitMQChannel,
  QUEUE_NAME,
} from "../config/rabbitmq";

export const publishAssetProcessingJob = async (asset: {
  id: number;
  storageKey: string;
  mimeType: string;
}): Promise<void> => {
  const channel = getRabbitMQChannel();

  const job = {
    assetId: asset.id,
    storageKey: asset.storageKey,
    mimeType: asset.mimeType,
  };

   channel.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(job)),
    {
      persistent: true,
      contentType: "application/json",
    }
  );

  // Wait for RabbitMQ to confirm receipt.
  await channel.waitForConfirms();

  console.log("Asset processing job confirmed:", job);
};