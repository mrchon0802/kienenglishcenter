import { cellToString, compactKey, isEmptyRow, mapHeaders, type SheetRows } from "./import-parse";
import { createEmptyQuestion, validateQuestion } from "./question-types";
import type { Difficulty, Question, QuestionType, Skill } from "@/types/question";

export const QUESTION_TEMPLATE_HEADER = [
  "Dạng", "Nội dung", "Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4", "Đáp án 5", "Đáp án 6",
  "Đáp án đúng", "Lớp", "Unit", "Kỹ năng", "Độ khó", "Điểm", "Giải thích", "Sách", "Ảnh", "Âm thanh",
];

/** Các dòng mẫu cho file tải về (mỗi dạng câu một dòng). */
export const QUESTION_TEMPLATE_ROWS: string[][] = [
  ["Trắc nghiệm", "She ___ to school every day.", "go", "goes", "going", "gone", "", "", "2", "4", "3", "Ngữ pháp", "Dễ", "1", "Chủ ngữ she thì động từ thêm -es", "Sách giáo khoa", "", ""],
  ["Nhiều đáp án", "Chọn TẤT CẢ các loại quả.", "apple", "carrot", "banana", "potato", "", "", "1,3", "3", "4", "Từ vựng", "Dễ", "2", "", "Sách giáo khoa", "", ""],
  ["Đúng/Sai", "\"Monday\" comes after \"Sunday\".", "", "", "", "", "", "", "Đúng", "3", "5", "Từ vựng", "Dễ", "1", "", "Sách giáo khoa", "", ""],
  ["Điền chỗ trống", "My name ___ Lan.", "", "", "", "", "", "", "is", "3", "1", "Ngữ pháp", "Dễ", "1", "", "Sách giáo khoa", "", ""],
  ["Nối cặp", "Nối từ với nghĩa tiếng Việt.", "", "", "", "", "", "", "dog=con chó; cat=con mèo; bird=con chim", "1", "2", "Từ vựng", "Dễ", "3", "", "Sách giáo khoa", "", ""],
  ["Sắp xếp", "Sắp xếp các từ thành câu đúng.", "", "", "", "", "", "", "I like to play football", "4", "2", "Ngữ pháp", "Trung bình", "1", "", "Sách giáo khoa", "", ""],
  ["Tự luận", "Viết 3 câu giới thiệu về gia đình em.", "", "", "", "", "", "", "There are four people in my family.", "6", "1", "Viết", "Trung bình", "3", "", "Sách giáo khoa", "", ""],
];

const HEADER_ALIASES: Record<string, string[]> = {
  type: ["dang", "dangcauhoi", "loai", "loaicauhoi", "type"],
  prompt: ["noidung", "cauhoi", "noidungcauhoi", "prompt"],
  correct: ["dapandung", "dapanchinhxac", "correct", "ketqua"],
  grade: ["lop", "khoi", "grade"],
  unit: ["unit", "bai"],
  skill: ["kynang", "skill"],
  difficulty: ["dokho", "difficulty"],
  points: ["diem", "points"],
  explanation: ["giaithich", "explanation"],
  book: ["sach", "book"],
  imageUrl: ["anh", "hinhanh", "image"],
  audioUrl: ["amthanh", "audio"],
};

const TYPE_ALIASES: Record<QuestionType, string[]> = {
  mcq: ["tracnghiem", "tracnghiem1dapan", "mcq", "motdapan", "1dapan"],
  multi: ["nhieudapan", "tracnghiemnhieudapan", "multi"],
  truefalse: ["dungsai", "truefalse", "dunghoacsai"],
  fillblank: ["dienvaochotrong", "dienchotrong", "fillblank", "dientu"],
  matching: ["noicap", "noi", "matching"],
  ordering: ["sapxep", "sapxeptuthanhcau", "sapxepcau", "ordering"],
  essay: ["tuluan", "essay"],
};

const SKILL_ALIASES: Record<Skill, string[]> = {
  vocabulary: ["tuvung", "vocabulary"],
  grammar: ["nguphap", "grammar"],
  reading: ["doc", "reading"],
  listening: ["nghe", "listening"],
  writing: ["viet", "writing"],
};

const DIFFICULTY_ALIASES: Record<Difficulty, string[]> = {
  1: ["de", "1", "easy"],
  2: ["trungbinh", "2", "medium"],
  3: ["kho", "3", "hard"],
};

function findKey<T extends string | number>(table: Record<T, string[]>, text: string): T | undefined {
  const key = compactKey(text);
  return (Object.keys(table) as unknown as T[]).find((k) => table[k].includes(key));
}

/** "2" hoặc "B" -> vị trí cột đáp án (1-6). */
function optionIndex(token: string): number | null {
  const t = token.trim().toUpperCase();
  if (/^[1-6]$/.test(t)) return Number(t);
  if (/^[A-F]$/.test(t)) return t.charCodeAt(0) - 64;
  return null;
}

export interface ImportedQuestion {
  rowNumber: number; // số dòng trong file (dòng 1 là tiêu đề)
  question: Question;
  errors: string[];
}

export interface QuestionParseResult {
  fileError?: string;
  items: ImportedQuestion[];
}

export function rowsToQuestions(rows: SheetRows): QuestionParseResult {
  if (rows.length === 0) return { items: [], fileError: "File trống." };
  const header = mapHeaders(rows[0], HEADER_ALIASES);
  const optionColumns: number[] = [];
  rows[0].forEach((cell, index) => {
    const m = compactKey(cellToString(cell)).match(/^dapan([1-6])$/);
    if (m) optionColumns[Number(m[1]) - 1] = index;
  });

  const missing = (["type", "prompt", "grade", "unit"] as const).filter((f) => !(f in header));
  if (missing.length > 0) {
    const names = { type: "Dạng", prompt: "Nội dung", grade: "Lớp", unit: "Unit" };
    return { items: [], fileError: `Thiếu cột bắt buộc: ${missing.map((m) => names[m]).join(", ")}. Hãy dùng đúng file mẫu.` };
  }

  const get = (row: SheetRows[number], field: string) => (field in header ? cellToString(row[header[field]]) : "");
  const items: ImportedQuestion[] = [];

  rows.slice(1).forEach((row, i) => {
    if (isEmptyRow(row)) return;
    const errors: string[] = [];
    const type = findKey(TYPE_ALIASES, get(row, "type"));
    const q = createEmptyQuestion(type ?? "mcq");
    if (!type) errors.push(`Dạng câu "${get(row, "type")}" không nhận ra.`);

    q.prompt = get(row, "prompt");
    q.explanation = get(row, "explanation");
    q.imageUrl = get(row, "imageUrl");
    q.audioUrl = get(row, "audioUrl");
    if (get(row, "book")) q.book = get(row, "book");

    const grade = Number(get(row, "grade").replace(/\D/g, ""));
    if (grade >= 1 && grade <= 9) q.grade = grade;
    else errors.push("Lớp phải từ 1 đến 9.");

    const unit = Number(get(row, "unit").replace(/\D/g, ""));
    if (unit >= 1 && unit <= 30) q.unit = unit;
    else errors.push("Unit phải từ 1 đến 30.");

    if (get(row, "skill")) {
      const skill = findKey(SKILL_ALIASES, get(row, "skill"));
      if (skill) q.skill = skill;
      else errors.push(`Kỹ năng "${get(row, "skill")}" không nhận ra (Từ vựng, Ngữ pháp, Đọc, Nghe, Viết).`);
    }
    if (get(row, "difficulty")) {
      const difficulty = findKey(DIFFICULTY_ALIASES, get(row, "difficulty"));
      if (difficulty) q.difficulty = difficulty;
      else errors.push(`Độ khó "${get(row, "difficulty")}" không nhận ra (Dễ, Trung bình, Khó).`);
    }
    if (get(row, "points")) {
      const points = Number(get(row, "points").replace(",", "."));
      if (points > 0) q.points = points;
      else errors.push("Điểm phải lớn hơn 0.");
    }

    const correct = get(row, "correct");
    if (type === "mcq" || type === "multi") {
      q.options = [];
      optionColumns.forEach((col, k) => {
        const text = cellToString(row[col]);
        if (text) q.options.push({ id: `opt-${k + 1}`, text });
      });
      const tokens = correct.split(/[,;\s/]+/).filter(Boolean);
      const ids = tokens.map((t) => {
        const n = optionIndex(t);
        return n !== null && q.options.some((o) => o.id === `opt-${n}`) ? `opt-${n}` : null;
      });
      if (tokens.length === 0 || ids.some((id) => id === null)) {
        errors.push('Cột "Đáp án đúng" cần là số thứ tự (hoặc chữ A-F) của đáp án có nội dung, ví dụ 2 hoặc 1,3.');
      } else {
        q.correctOptionIds = [...new Set(ids as string[])];
        if (type === "mcq" && q.correctOptionIds.length !== 1) errors.push("Trắc nghiệm 1 đáp án chỉ chọn đúng 1 đáp án.");
      }
    } else if (type === "truefalse") {
      const t = compactKey(correct);
      if (["dung", "true", "d"].includes(t)) q.trueFalseAnswer = true;
      else if (["sai", "false", "s"].includes(t)) q.trueFalseAnswer = false;
      else errors.push('Cột "Đáp án đúng" của câu Đúng/Sai là Đúng hoặc Sai.');
    } else if (type === "fillblank") {
      q.acceptedAnswers = correct.split(/[|;]/).map((a) => a.trim()).filter(Boolean);
    } else if (type === "matching") {
      q.pairs = correct
        .split(/;|\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, k) => {
          const [left, ...rest] = p.split(/=|->/);
          return { id: `pair-${k + 1}`, left: (left ?? "").trim(), right: rest.join("=").trim() };
        });
    } else if (type === "ordering") {
      q.sentence = correct;
    } else if (type === "essay") {
      q.sampleAnswer = correct;
    }

    if (type) errors.push(...Object.values(validateQuestion(q)));
    items.push({ rowNumber: i + 2, question: q, errors: [...new Set(errors)] });
  });

  return { items };
}
