export type QuestionType =
  | "mcq" // trắc nghiệm 1 đáp án
  | "multi" // trắc nghiệm nhiều đáp án
  | "truefalse" // đúng / sai
  | "fillblank" // điền vào chỗ trống
  | "matching" // nối cặp
  | "ordering" // sắp xếp từ thành câu
  | "essay"; // tự luận, giáo viên chấm tay

export type Skill = "vocabulary" | "grammar" | "reading" | "listening" | "writing";
export type Difficulty = 1 | 2 | 3;
export type QuestionStatus = "active" | "archived";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

/**
 * Câu hỏi dùng cho ADMIN (có đáp án). Mỗi dạng chỉ dùng một số trường, các trường còn lại để rỗng.
 * Khi làm backend: có thể lưu dạng union theo `type`, nhưng nên giữ đúng tên trường này.
 * Lưu ý: bản gửi cho HỌC SINH phải bỏ hết các trường đáp án (sẽ làm ở phần làm bài).
 */
export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl: string;
  audioUrl: string;
  points: number;
  explanation: string;

  // Phân loại theo sách giáo khoa
  grade: number; // 1-9
  book: string;
  unit: number;
  skill: Skill;
  difficulty: Difficulty;

  status: QuestionStatus;
  createdAt: string; // ISO yyyy-mm-dd

  // Dữ liệu theo dạng câu
  options: QuestionOption[]; // mcq, multi
  correctOptionIds: string[]; // mcq (đúng 1), multi (>= 1)
  trueFalseAnswer: boolean; // truefalse
  acceptedAnswers: string[]; // fillblank
  pairs: MatchPair[]; // matching
  sentence: string; // ordering: câu đúng
  sampleAnswer: string; // essay: đáp án mẫu (không bắt buộc)
}
