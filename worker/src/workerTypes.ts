import type {
  ChannelModel,
  ConfirmChannel,
} from "amqplib";

export interface WorkerRuntime {
  shuttingDown: boolean;
  currentConnection?: ChannelModel;
  currentChannel?: ConfirmChannel;
  consumerTag?: string;
  activeJob?: Promise<void>;
}