import { Global, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { QueueProducerService } from './queue-producer.service';
import { QueueConsumerService } from './queue-consumer.service';
import { EnvModule } from '../env/env.module';

@Global()
@Module({
  imports: [EnvModule],
  providers: [RabbitMQService, QueueProducerService, QueueConsumerService],
  exports: [RabbitMQService, QueueProducerService, QueueConsumerService],
})
export class RabbitMQModule {}
