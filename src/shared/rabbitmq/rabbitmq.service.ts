import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as amqp from 'amqplib';
import { EnvService } from '../env/env.service';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly reconnectDelay = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private readonly envService: EnvService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const amqpUri = this.envService.get('AMQP_URI');
      this.connection = await amqp.connect(amqpUri);
      this.channel = await this.connection.createChannel();

      this.connection.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, reconnecting...');
        this.scheduleReconnect();
      });

      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.disconnect();
      await this.connect();
    }, this.reconnectDelay);
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async getChannel(): Promise<amqp.Channel> {
    if (!this.connection || !this.channel) {
      await this.connect();
    }
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    return this.channel;
  }

  async assertQueue(queue: string, options?: amqp.Options.AssertQueue) {
    const channel = await this.getChannel();
    return channel.assertQueue(queue, { durable: true, ...options });
  }

  async assertExchange(
    exchange: string,
    type: string,
    options?: amqp.Options.AssertExchange,
  ) {
    const channel = await this.getChannel();
    return channel.assertExchange(exchange, type, {
      durable: true,
      ...options,
    });
  }

  async bindQueue(queue: string, exchange: string, routingKey: string) {
    const channel = await this.getChannel();
    return channel.bindQueue(queue, exchange, routingKey);
  }
}
