import { EssayEditor } from "./EssayEditor";
import { FillBlankEditor } from "./FillBlankEditor";
import { MatchingEditor } from "./MatchingEditor";
import { OptionsEditor } from "./OptionsEditor";
import { OrderingEditor } from "./OrderingEditor";
import { TrueFalseEditor } from "./TrueFalseEditor";
import type { EditorProps } from "./types";

/** Chọn trình soạn đáp án đúng theo dạng câu hỏi. Thêm dạng mới: thêm một case ở đây. */
export function AnswerEditor(props: EditorProps) {
  switch (props.question.type) {
    case "mcq":
    case "multi":
      return <OptionsEditor {...props} />;
    case "truefalse":
      return <TrueFalseEditor {...props} />;
    case "fillblank":
      return <FillBlankEditor {...props} />;
    case "matching":
      return <MatchingEditor {...props} />;
    case "ordering":
      return <OrderingEditor {...props} />;
    case "essay":
      return <EssayEditor {...props} />;
  }
}
