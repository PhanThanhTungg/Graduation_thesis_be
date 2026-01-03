import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { QueueName, QUEUE_CONFIG } from './queue.constants';

type MessageHandler<T = any> = (message: T) => Promise<void>;

@Injectable()
export class QueueConsumerService {
  private readonly logger = new Logger(QueueConsumerService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async consume<T>(queueName: QueueName, handler: MessageHandler<T>) {
    try {
      const config = QUEUE_CONFIG[queueName];
      if (!config) {
        throw new Error(`Queue config not found for: ${queueName}`);
      }

      const channel = await this.rabbitMQService.getChannel();

      await channel.prefetch(10);

      await this.rabbitMQService.assertExchange(config.exchange, 'direct');
      await this.rabbitMQService.assertQueue(config.queue, {
        arguments: config.dlq
          ? {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': config.dlq,
            }
          : undefined,
      });
      await this.rabbitMQService.bindQueue(
        config.queue,
        config.exchange,
        config.routingKey,
      );

      if (config.dlq) {
        await this.rabbitMQService.assertQueue(config.dlq);
      }

      await channel.consume(config.queue, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          channel.ack(msg);
          this.logger.debug(`Message processed from queue: ${queueName}`);
        } catch (error) {
          this.logger.error(
            `Error processing message from queue ${queueName}:`,
            error,
          );
          channel.nack(msg, false, false);
        }
      });

      this.logger.log(`Consumer started for queue: ${queueName}`);
    } catch (error) {
      this.logger.error(
        `Error setting up consumer for queue ${queueName}:`,
        error,
      );
      throw error;
    }
  }
}
