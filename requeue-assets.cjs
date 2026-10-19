const amqp = require("./backend/node_modules/amqplib");
const jobs = [
  {
    assetId: 33,
    storageKey: "originals/1792078260554-82ndlhjqggy.jpg",
    mimeType: "image/jpeg",
  },
  {
    assetId: 34,
    storageKey: "originals/1792078337454-9ki8gvwtkgk.jpg",
    mimeType: "image/jpeg",
  },
];

async function main() {
  const url = process.env.RABBITMQ_URL;

  if (!url) {
    throw new Error("RABBITMQ_URL is not set.");
  }

  const connection = await amqp.connect(url);
  const channel = await connection.createConfirmChannel();

  try {
    await channel.checkQueue("asset-processing");

    for (const job of jobs) {
      channel.sendToQueue(
        "asset-processing",
        Buffer.from(JSON.stringify(job)),
        { persistent: true }
      );

      await channel.waitForConfirms();
      console.log(`Published job for asset ${job.assetId}`);
    }
  } finally {
    await channel.close();
    await connection.close();
  }
}

main().catch((error) => {
  console.error("Requeue failed:", error.message);
  process.exitCode = 1;
});
