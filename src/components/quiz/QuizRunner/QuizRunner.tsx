"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitAttemptAction } from "@/app/student/assignments/actions";
import { QuestionRenderer } from "@/components/quiz/renderers";
import { ResultView } from "@/components/quiz/ResultView";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format-datetime";
import { formatScore } from "@/lib/format";
import type {
  AnswerMap,
  AnswerValue,
  StudentAssignmentSummary,
  StudentQuestion,
  SubmissionResult,
} from "@/types/quiz";
import styles from "./QuizRunner.module.css";

interface QuizRunnerProps {
  info: StudentAssignmentSummary;
  questions: StudentQuestion[];
  lastResult: SubmissionResult | null;
  canAttempt: boolean;
  blockedReason?: string;
}

type Phase = "intro" | "playing" | "result";

interface Draft {
  answers: AnswerMap;
  startedAt: number;
  index: number;
}

function isAnswered(q: StudentQuestion, v: AnswerValue | undefined): boolean {
  if (v === undefined) return false;
  switch (q.type) {
    case "mcq":
    case "fillblank":
    case "essay":
      return typeof v === "string" && v.trim() !== "";
    case "multi":
      return Array.isArray(v) && v.length > 0;
    case "truefalse":
      return typeof v === "boolean";
    case "matching":
      return typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === q.leftItems.length;
    case "ordering":
      return Array.isArray(v) && v.length === q.words.length;
  }
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function QuizRunner({ info, questions, lastResult, canAttempt, blockedReason }: QuizRunnerProps) {
  const draftKey = `quiz-draft:${info.id}`;
  const [phase, setPhase] = useState<Phase>(!canAttempt && lastResult ? "result" : "intro");
  const [result, setResult] = useState<SubmissionResult | null>(lastResult);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const totalSeconds = info.durationMinutes ? info.durationMinutes * 60 : null;
  const unanswered = questions.filter((q) => !isAnswered(q, answers[q.id])).length;

  // Khôi phục bài đang làm dở (tải lại trang, lỡ đóng tab...).
  useEffect(() => {
    if (!canAttempt) return;
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      setAnswers(draft.answers);
      setIndex(Math.min(draft.index, questions.length - 1));
      setStartedAt(draft.startedAt);
      setPhase("playing");
    } catch {
      sessionStorage.removeItem(draftKey);
    }
  }, [canAttempt, draftKey, questions.length]);

  // Tự lưu nháp mỗi khi đổi câu trả lời.
  useEffect(() => {
    if (phase !== "playing") return;
    const draft: Draft = { answers, startedAt, index };
    sessionStorage.setItem(draftKey, JSON.stringify(draft));
  }, [phase, answers, startedAt, index, draftKey]);

  // Đồng hồ đếm ngược (tính từ lúc bắt đầu, nên tải lại trang vẫn đúng giờ).
  useEffect(() => {
    if (phase !== "playing" || totalSeconds === null) return;
    const tick = () => setSecondsLeft(Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase, totalSeconds, startedAt]);

  function submit() {
    if (pending) return; // chống bấm nộp nhiều lần
    setError("");
    startTransition(async () => {
      const response = await submitAttemptAction(info.id, answers);
      if (response.ok) {
        sessionStorage.removeItem(draftKey);
        setResult(response.result);
        setConfirming(false);
        setPhase("result");
      } else {
        setError(response.error);
      }
    });
  }

  // Hết giờ thì tự nộp bài.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    if (phase === "playing" && secondsLeft === 0) submitRef.current();
  }, [phase, secondsLeft]);

  function start() {
    setAnswers({});
    setIndex(0);
    setConfirming(false);
    setError("");
    setStartedAt(Date.now());
    setPhase("playing");
  }

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  // ---------- Kết quả ----------
  if (phase === "result" && result) {
    return <ResultView result={result} kind={info.kind} onRetry={canAttempt ? start : undefined} />;
  }

  // ---------- Màn hình giới thiệu ----------
  if (phase === "intro") {
    return (
      <Card>
        <div className={styles.intro}>
          <p>
            <Badge tone={info.kind === "test" ? "amber" : "teal"}>
              {info.kind === "test" ? "Bài kiểm tra" : "Bài luyện tập"}
            </Badge>
          </p>
          <ul className={styles.facts}>
            <li>{info.questionCount} câu hỏi</li>
            <li>{info.durationMinutes ? `Thời gian làm bài: ${info.durationMinutes} phút` : "Không giới hạn thời gian"}</li>
            <li>{info.kind === "test" ? "Chỉ được làm 1 lần" : "Có thể làm lại nhiều lần, điểm cao nhất được ghi nhận"}</li>
            <li>Hạn nộp: {formatDateTime(info.dueAt)}</li>
            {info.bestScore !== null ? <li>Điểm cao nhất của em: {formatScore(info.bestScore)}</li> : null}
          </ul>
          {canAttempt ? (
            <Button variant="primary" onClick={start} className={styles.startButton}>
              Bắt đầu làm bài
            </Button>
          ) : (
            <p className={styles.blocked} role="status">{blockedReason}</p>
          )}
        </div>
      </Card>
    );
  }

  // ---------- Đang làm bài ----------
  const question = questions[index];
  const isLast = index === questions.length - 1;

  return (
    <div className={styles.player}>
      <div className={styles.topbar}>
        <p className={styles.progress}>
          Câu {index + 1} / {questions.length}
        </p>
        {secondsLeft !== null ? (
          <p className={`${styles.timer} ${secondsLeft <= 60 ? styles.timerLow : ""}`} role="timer">
            Còn lại {formatClock(secondsLeft)}
          </p>
        ) : null}
      </div>

      <div className={styles.navigator} role="group" aria-label="Danh sách câu hỏi">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            className={`${styles.dot} ${i === index ? styles.dotCurrent : ""} ${isAnswered(q, answers[q.id]) ? styles.dotDone : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Câu ${i + 1}${isAnswered(q, answers[q.id]) ? ", đã trả lời" : ", chưa trả lời"}`}
            aria-current={i === index ? "step" : undefined}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card>
        <QuestionRenderer
          key={question.id}
          question={question}
          value={answers[question.id]}
          onChange={(value) => setAnswer(question.id, value)}
        />
      </Card>

      {confirming ? (
        <Card>
          <p className={styles.confirmText}>
            {unanswered > 0
              ? `Em còn ${unanswered} câu chưa trả lời. Em muốn nộp bài luôn không?`
              : "Em đã trả lời hết các câu. Nộp bài nhé?"}
          </p>
          <div className={styles.actions}>
            <Button onClick={() => setConfirming(false)} disabled={pending}>
              Quay lại làm tiếp
            </Button>
            <Button variant="primary" onClick={submit} disabled={pending}>
              {pending ? "Đang chấm bài..." : "Nộp bài"}
            </Button>
          </div>
        </Card>
      ) : (
        <div className={styles.actions}>
          <Button onClick={() => setIndex(index - 1)} disabled={index === 0}>
            Câu trước
          </Button>
          {isLast ? (
            <Button variant="primary" onClick={() => setConfirming(true)}>
              Nộp bài
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setIndex(index + 1)}>
              Câu tiếp theo
            </Button>
          )}
          {!isLast ? (
            <Button onClick={() => setConfirming(true)} className={styles.submitEarly}>
              Nộp bài
            </Button>
          ) : null}
        </div>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
