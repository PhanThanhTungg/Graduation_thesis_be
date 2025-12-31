import { TypeQuestion } from '@prisma/client';

const escapeTelegramHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type ChoiceOption = { name?: string; text?: string };
type GeneratedQuestionJson = {
  statement?: string;
  options?: ChoiceOption[];
};

const parseQuestionJson = (statement: string): GeneratedQuestionJson | null => {
  const trimmed = (statement || '').trim();
  if (!trimmed) return null;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed[0] ?? null;
    return parsed ?? null;
  } catch {
    return null;
  }
};

export const formatChoiceQues = (statement: string) => {
  const parsed = parseQuestionJson(statement);
  const q = parsed?.statement
    ? escapeTelegramHtml(parsed.statement)
    : escapeTelegramHtml(statement);
  const options = Array.isArray(parsed?.options) ? parsed!.options! : [];
  const renderedOptions =
    options.length > 0
      ? `\n\n${options
          .map((o, idx) => {
            const name = (o?.name ?? String.fromCharCode(65 + idx))
              .toString()
              .trim();
            const text = escapeTelegramHtml((o?.text ?? '').toString().trim());
            return text
              ? `${escapeTelegramHtml(name)}. ${text}`
              : `${escapeTelegramHtml(name)}.`;
          })
          .join('\n')}`
      : '';
  return `${q}${renderedOptions}`.trim();
};

export const formatFillInTheBlankQues = (statement: string) => {
  const parsed = parseQuestionJson(statement);
  return escapeTelegramHtml((parsed?.statement ?? statement).toString()).trim();
};

export const formatShortAnswerQues = (statement: string) => {
  const parsed = parseQuestionJson(statement);
  return escapeTelegramHtml((parsed?.statement ?? statement).toString()).trim();
};

export const formatTrueFalseQues = (statement: string) => {
  const parsed = parseQuestionJson(statement);
  return escapeTelegramHtml((parsed?.statement ?? statement).toString()).trim();
};

export const formatQuestionForTelegram = (input: {
  type: TypeQuestion | string;
  statement: string;
}) => {
  switch (input.type) {
    case TypeQuestion.single_choice:
    case TypeQuestion.multiple_choice:
      return formatChoiceQues(input.statement);
    case TypeQuestion.fill_in_the_blank:
      return formatFillInTheBlankQues(input.statement);
    case TypeQuestion.short_answer:
      return formatShortAnswerQues(input.statement);
    case TypeQuestion.true_false:
      return formatTrueFalseQues(input.statement);
    default:
      return escapeTelegramHtml(input.statement).trim();
  }
};

export const transformScore = (score: number): number => {
  return score >= 85
    ? 5
    : score >= 70
      ? 4
      : score >= 55
        ? 3
        : score >= 40
          ? 2
          : score >= 20
            ? 1
            : 0;
};
