import type { CorrectOption } from '@prisma/client';

export type AnswerRow = { questionId: string; selected: CorrectOption | null };

/** Server-computed exam end time. Null when the test is untimed. */
export function endsAt(attempt: { startedAt: Date }, durationMins: number | null | undefined) {
  if (!durationMins) return null;
  return new Date(attempt.startedAt.getTime() + durationMins * 60_000);
}

/**
 * Whether the server clock says the attempt's time is up. The server is the
 * single source of truth — client-supplied timestamps are never trusted.
 */
export function durationExpired(
  attempt: { startedAt: Date },
  durationMins: number | null | undefined,
  now: Date = new Date(),
) {
  if (!durationMins) return false;
  return now.getTime() > attempt.startedAt.getTime() + durationMins * 60_000;
}

/**
 * Anti-cheat: decide whether a resume is a GENUINE device/tab takeover (a
 * violation) vs. the same person quickly re-entering (page re-mount, React
 * StrictMode double-invoke, quick refresh — NOT a violation). Only a stale
 * previous session (last activity ≥ graceSeconds ago) with an existing token
 * counts as a takeover.
 */
export function isGenuineTakeover(
  lastActive: Date,
  hasExistingToken: boolean,
  now: Date = new Date(),
  graceSeconds = 25,
): boolean {
  if (!hasExistingToken) return false;
  const secondsSinceActive = (now.getTime() - lastActive.getTime()) / 1000;
  return secondsSinceActive >= graceSeconds;
}

/**
 * Pure MCQ grading with negative marking. Returns totals plus a per-question
 * review. Unanswered questions score 0 (no negative mark).
 */
export function gradeAnswers(
  questions: { id: string; correctOption: CorrectOption; marks: number }[],
  answers: AnswerRow[],
  negativeMark: number,
) {
  const map = new Map(answers.map((a) => [a.questionId, a.selected]));
  let correct = 0;
  let wrong = 0;
  let score = 0;
  let totalMarks = 0;
  const review = questions.map((q) => {
    totalMarks += q.marks;
    const selected = map.get(q.id) ?? null;
    const isCorrect = selected === q.correctOption;
    if (selected == null) {
      /* unanswered — no score change */
    } else if (isCorrect) {
      correct += 1;
      score += q.marks;
    } else {
      wrong += 1;
      score -= negativeMark;
    }
    return {
      questionId: q.id,
      selected,
      correctOption: q.correctOption,
      isCorrect,
      marks: q.marks,
    };
  });
  // Never report a negative total; round to 2 dp to avoid float drift.
  score = Math.max(0, Math.round(score * 100) / 100);
  return { correct, wrong, score, totalMarks, review };
}
