export enum QueueName {
  SPACE_REPETITION_QUESTION = 'space_repetition_question',
}

export const QUEUE_CONFIG = {
  [QueueName.SPACE_REPETITION_QUESTION]: {
    queue: QueueName.SPACE_REPETITION_QUESTION,
    exchange: 'space_repetition',
    routingKey: 'question',
    durable: true,
    dlq: 'space_repetition_question_dlq',
  },
} as const;
