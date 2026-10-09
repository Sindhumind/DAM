
import amqp, { ConfirmChannel, ChannelModel } from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

if (!RABBITMQ_URL) {
  throw new Error("Missing required environment variable: RABBITMQ_URL");
}

export const QUEUE_NAME = "asset-processing";

let connection: ChannelModel;
let channel: ConfirmChannel;

export const connectRabbitMQ = async (): Promise<ConfirmChannel> => {
  connection = await amqp.connect(RABBITMQ_URL);

  channel = await connection.createConfirmChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  console.log("RabbitMQ connected with publisher confirms");

  return channel;
};

export const getRabbitMQChannel = (): ConfirmChannel => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  return channel;
};
