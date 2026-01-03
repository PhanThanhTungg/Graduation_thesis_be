import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { QueueName, QUEUE_CONFIG } from './queue.constants';

@Injectable()
export class QueueProducerService {
  private readonly logger = new Logger(QueueProducerService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async sendToQueue<T>(queueName: QueueName, message: T): Promise<boolean> {
    try {
      const config = QUEUE_CONFIG[queueName];
      if (!config) {
        throw new Error(`Queue config not found for: ${queueName}`);
      }

      const channel = await this.rabbitMQService.getChannel();

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

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const sent = channel.publish(
        config.exchange,
        config.routingKey,
        messageBuffer,
        {
          persistent: true,
        },
      );
      if (sent) {
        this.logger.debug(`Message sent to queue: ${queueName}`);
        return true;
      } else {
        this.logger.warn(
          `Message not sent to queue: ${queueName} (buffer full)`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(`Error sending message to queue ${queueName}:`, error);
      throw error;
    }
  }
}
