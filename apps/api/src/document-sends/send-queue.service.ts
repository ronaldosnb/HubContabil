import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SendChannel } from "@prisma/client";
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@hubcontabil/shared";

@Injectable()
export class SendQueueService implements OnModuleDestroy {
  private readonly queues: Record<SendChannel, Queue>;

  constructor(config: ConfigService) {
    const connection = {
      host: config.get<string>("REDIS_HOST", "localhost"),
      port: Number(config.get<string>("REDIS_PORT", "6379")),
      maxRetriesPerRequest: null
    };

    this.queues = {
      EMAIL: new Queue(QUEUE_NAMES.EMAIL_SEND, { connection }),
      WHATSAPP: new Queue(QUEUE_NAMES.WHATSAPP_SEND, { connection })
    };
  }

  async add(channel: SendChannel, documentSendChannelId: string) {
    await this.queues[channel].add(
      `${channel.toLowerCase()}-${documentSendChannelId}`,
      { documentSendChannelId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    );
  }

  async onModuleDestroy() {
    await Promise.all(Object.values(this.queues).map((queue) => queue.close()));
  }
}
