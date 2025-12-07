import { Question, TypeQuestion } from '@prisma/client';

export const answerQuestionPrompt = (question: Question, answer: string) => {
  const subTask =
    question.type === TypeQuestion.fill_in_the_blank ||
    question.type === TypeQuestion.short_answer
      ? `
      - 0 điểm: Sai hoàn toàn, không liên quan
      - 1-25 điểm: Gần đúng/đoán đúng 1 phần nhỏ
      - 26-50 điểm: Có ý đúng nhưng thiếu/thiếu rõ ràng
      - 51-75 điểm: Gần đúng toàn bộ, chỉ thiếu vài chi tiết nhỏ
      - 76-99 điểm: Gần như đúng hoàn toàn, chỉ sai rất nhỏ (chính tả, ngữ pháp nhẹ,...)
      - 100 điểm: Đúng tuyệt đối, đầy đủ, rõ ràng
    `
      : TypeQuestion.true_false || TypeQuestion.single_choice
        ? `
      - 0 điểm: sai
      - 100 điểm : đúng
    `
        : TypeQuestion.multiple_choice
          ? `
      Điểm từ 0 - 100, dựa vào số lượng đáp án đúng và số lượng đáp án sai
    `
          : null;

  return `
    Bạn là một chuyên gia giáo dục trong lĩnh vực giáo dục
    Tôi sẽ cung cấp cho bạn một câu hỏi và câu trả lời của học sinh
    Câu hỏi: ${question.statement}
    Câu trả lời của học sinh: ${answer}
    NHIỆM VỤ:
      1. Hãy chấm điểm câu trả lời của học sinh theo thang điểm sau:
        ${subTask}
      2. Trả về đúng điểm số và giải thích tại sao, nếu đúng tại sao đúng, nếu sai tại sao sai.
      3. Đánh giá học sinh ngắn gọn : hiểu được phần nào, còn yếu phần nào, dùng ở biến aiFeedback ở đầu ra

    YÊU CẦU ĐẦU RA:
      Dạng JSON: 
      {
        score: number,
        explain: string,
        aiFeedback: string
      }
      Không trả về bất kỳ thông tin nào ngoài dạng JSON trên
  `;
};
