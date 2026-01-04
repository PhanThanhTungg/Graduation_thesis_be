export enum QueueName {
  SPACE_REPETITION_QUESTION = 'space_repetition_question',
  WITHDRAWAL_PROCESSING = 'withdrawal_processing',
}

export const QUEUE_CONFIG = {
  [QueueName.SPACE_REPETITION_QUESTION]: {
    queue: QueueName.SPACE_REPETITION_QUESTION,
    exchange: 'space_repetition',
    routingKey: 'question',
    durable: true,
    dlq: 'space_repetition_question_dlq',
  },
  [QueueName.WITHDRAWAL_PROCESSING]: {
    queue: QueueName.WITHDRAWAL_PROCESSING,
    exchange: 'withdrawal',
    routingKey: 'process',
    durable: true,
    dlq: 'withdrawal_processing_dlq',
  },
} as const;
