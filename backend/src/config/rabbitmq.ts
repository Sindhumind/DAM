import amqp, { ConfirmChannel, ChannelModel } from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

if (!RABBITMQ_URL) {
  throw new Error("Missing required environment variable: RABBITMQ_URL");
}

export const QUEUE_NAME = "asset-processing";
export const RETRY_QUEUE_NAME = "asset-processing-retry";
export const DEAD_LETTER_QUEUE_NAME = "asset-processing-dead";
export const MAX_PROCESSING_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 10000;

let connection: ChannelModel;
let channel: ConfirmChannel;

export const connectRabbitMQ = async (): Promise<ConfirmChannel> => {
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createConfirmChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  await channel.assertQueue(RETRY_QUEUE_NAME, {
    durable: true,
    arguments: {
      "x-message-ttl": RETRY_DELAY_MS,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": QUEUE_NAME,
    },
  });

  await channel.assertQueue(DEAD_LETTER_QUEUE_NAME, {
    durable: true,
  });

  console.log("RabbitMQ connected with publisher confirms");
  console.log("Retry queue:", RETRY_QUEUE_NAME);
  console.log("Dead-letter queue:", DEAD_LETTER_QUEUE_NAME);

  return channel;
};

export const getRabbitMQChannel = (): ConfirmChannel => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  return channel;
};

export const closeRabbitMQ = async (): Promise<void> => {
  if (channel) {
    await channel.close().catch(() => {});
  }

  if (connection) {
    await connection.close().catch(() => {});
  }
};