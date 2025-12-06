import { Difficulty, Question, TypeQuestion } from '@prisma/client';
import { GenerateQuestionsDto } from 'src/modules/question/client/dto/generate.dto';

const genQuestionPrompt = {
  lesson: (
    topic: string,
    description: string | null,
    DetailInfo: GenerateQuestionsDto,
    history: Question[] = [],
  ) => {
    const typeQuesPrompt =
      DetailInfo.typeQuestion === TypeQuestion.single_choice
        ? 'Câu hỏi dưới dạng câu hỏi chọn 1 đáp án đúng, tất cả có 4 đáp án, câu hỏi rõ ràng, ngắn gọn, súc tích, không quá dài để người học có thể trả lời nhanh'
        : DetailInfo.typeQuestion === TypeQuestion.multiple_choice
          ? 'Câu hỏi dưới dạng câu hỏi chọn nhiều đáp án đúng, tất cả có 4 đáp án, câu hỏi rõ ràng, ngắn gọn, súc tích, không quá dài để người học có thể trả lời nhanh'
          : DetailInfo.typeQuestion === TypeQuestion.fill_in_the_blank
            ? 'Câu hỏi dưới dạng điền từ vào chỗ trống, câu hỏi rõ ràng, ngắn gọn, súc tích, không quá dài để người học có thể trả lời nhanh'
            : DetailInfo.typeQuestion === TypeQuestion.short_answer
              ? 'Câu hỏi dưới dạng câu hỏi trả lời ngắn, câu hỏi rõ ràng, ngắn gọn, súc tích, không quá dài để người học có thể trả lời nhanh'
              : DetailInfo.typeQuestion === TypeQuestion.true_false
                ? 'Câu hỏi dưới dạng câu hỏi đúng sai, câu hỏi rõ ràng, ngắn gọn, súc tích, không quá dài để người học có thể trả lời nhanh'
                : null;
    if (!typeQuesPrompt) throw new Error('Invalid type question');

    let responseFormat =
      DetailInfo.typeQuestion === TypeQuestion.single_choice
        ? `
        Với dạng json như sau:
        {
          "statement": "Câu hỏi",
          "options": [
            {
              "name": "A",
              "text": "Đáp án A"
            }
          ]
        }
      `
        : DetailInfo.typeQuestion === TypeQuestion.multiple_choice
          ? `
          Với dạng json như sau:
          {
            "statement": "Câu hỏi",
            "options": [
              {
                "name": "A",
                "text": "Đáp án A"
              }
            ]
          }
        `
          : DetailInfo.typeQuestion === TypeQuestion.fill_in_the_blank
            ? `
          Với dạng json như sau:
          {
            "statement": "Câu hỏi có chứa ___ để đánh dấu chỗ trống cần điền"
          }
        `
            : DetailInfo.typeQuestion === TypeQuestion.short_answer
              ? `
          Với dạng json như sau:
          {
            "statement": "Câu hỏi"
          }
        `
              : DetailInfo.typeQuestion === TypeQuestion.true_false
                ? `
          Với dạng json như sau:
          {
            "statement": "Câu hỏi"
          }
        `
                : null;
    if (!responseFormat) throw new Error('Invalid response format');
    responseFormat += `\n Nếu có nhiều câu hỏi thì trả về mảng`;

    const difficultyRequire =
      DetailInfo.difficulty === Difficulty.very_easy
        ? 'Câu hỏi rất dễ, ở mức cơ bản nhất cho người mới bắt đầu học'
        : DetailInfo.difficulty === Difficulty.easy
          ? 'Câu hỏi dễ, ở mức tương đối dễ, có thể trả lời được bằng cách nhớ lại kiến thức đã học'
          : DetailInfo.difficulty === Difficulty.medium
            ? 'Câu hỏi trung bình, ở mức khá, có thể trả lời được bằng cách nhớ lại kiến thức đã học'
            : DetailInfo.difficulty === Difficulty.hard
              ? 'Câu hỏi khó, ở mức khá khó, đòi hỏi phải suy luận mới trả lời được'
              : DetailInfo.difficulty === Difficulty.very_hard
                ? 'Câu hỏi rất khó, ở mức rất khó, đòi hỏi phải suy luận rất kỹ lưỡng và phải có kiến thức rất sâu sắc mới trả lời được'
                : null;
    if (!difficultyRequire) throw new Error('Invalid difficulty');

    return `
      Bạn là một chuyên gia giáo dục có kinh nghiệm thiết kế chương trình học và thiết kế câu hỏi.
  
      KIẾN THỨC CẦN TẠO CÂU HỎI:
      - Tên kiến thức: ${topic}
      - Mô tả của kiến thức: ${description}
  
      LỊCH SỬ HỎI ĐÁP:
      ${
        history.length > 0
          ? `- Lịch sử hỏi đáp: ${history.map((question, index) => `- Câu hỏi ${index + 1}: ${question.statement}\n- Câu trả lời: ${question.answer}\n- Đánh giá: ${question.aiFeedback}`).join('\n')}`
          : 'Không có lịch sử hỏi đáp'
      }
  
      NHIỆM VỤ:
      Dựa vào những thông tin trên, hãy tạo ra đúng 1 câu hỏi phù hợp đáp ứng việc học tập hiệu quả của học sinh
      Nếu bạn cảm thấy học sinh cần cải thiện phần nào hãy đặt câu hỏi để học sinh cải thiện phần đó
      Nếu bạn cảm thấy học sinh cần bổ sung phần nào hãy đặt câu hỏi để bổ sung phần đó. 
      Đặc biệt, câu hỏi phải nằm trong phạm vi học sinh có thể trả lời bằng text và bạn có thể chấm điểm được nha
      Câu hỏi không chứa các dạng như hình, video, âm thanh, ...
  
      YÊU CẦU ĐẦU RA:
      1. Dạng câu hỏi : ${typeQuesPrompt}
      2. Số lượng câu hỏi: ${DetailInfo.totalQuestion}
      3. Trả về đúng câu hỏi không giải thích gì thêm, không thêm những text ngoài lề, chỉ nội dung câu hỏi thôi
      4. Đề bài phải phù hợp với tình hình học tập hiện tại của học sinh
      5. Độ khó: ${difficultyRequire}
      6. Định dạng đầu ra: ${responseFormat}
    `;
  },
};

export default genQuestionPrompt;
