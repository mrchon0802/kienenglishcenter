import type { QuestionErrors } from "@/lib/question-types";
import type { Question } from "@/types/question";

export interface EditorProps {
  question: Question;
  errors: QuestionErrors;
  onChange: (patch: Partial<Question>) => void;
}
