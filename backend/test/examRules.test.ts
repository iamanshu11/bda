import { describe, it, expect } from 'vitest';
import {
  durationExpired,
  endsAt,
  gradeAnswers,
  isGenuineTakeover,
  type AnswerRow,
} from '@/utils/examRules';

describe('exam timer is server-authoritative (B5)', () => {
  const started = new Date('2026-01-01T10:00:00Z');

  it('computes endsAt from server start + duration', () => {
    expect(endsAt({ startedAt: started }, 30)?.toISOString()).toBe('2026-01-01T10:30:00.000Z');
  });

  it('untimed tests never expire and have no end', () => {
    expect(endsAt({ startedAt: started }, null)).toBeNull();
    expect(durationExpired({ startedAt: started }, null, new Date('2030-01-01'))).toBe(false);
  });

  it('is not expired before duration elapses', () => {
    const now = new Date('2026-01-01T10:29:59Z');
    expect(durationExpired({ startedAt: started }, 30, now)).toBe(false);
  });

  it('is expired after duration elapses (client clock irrelevant)', () => {
    const now = new Date('2026-01-01T10:30:01Z');
    expect(durationExpired({ startedAt: started }, 30, now)).toBe(true);
  });
});

describe('anti-cheat takeover grace (B6)', () => {
  const now = new Date('2026-01-01T10:00:30Z');

  it('does NOT flag a rapid re-mount / StrictMode double-start', () => {
    const lastActive = new Date('2026-01-01T10:00:20Z'); // 10s ago
    expect(isGenuineTakeover(lastActive, true, now)).toBe(false);
  });

  it('flags a genuine takeover when the previous session is stale (>=25s)', () => {
    const lastActive = new Date('2026-01-01T10:00:00Z'); // 30s ago
    expect(isGenuineTakeover(lastActive, true, now)).toBe(true);
  });

  it('never flags when there was no prior session token', () => {
    const lastActive = new Date('2026-01-01T09:00:00Z');
    expect(isGenuineTakeover(lastActive, false, now)).toBe(false);
  });
});

describe('MCQ grading with negative marking (C1)', () => {
  const questions = [
    { id: 'q1', correctOption: 'A' as const, marks: 2 },
    { id: 'q2', correctOption: 'B' as const, marks: 2 },
    { id: 'q3', correctOption: 'C' as const, marks: 2 },
  ];

  it('scores correct answers and applies negative marking to wrong ones', () => {
    const answers: AnswerRow[] = [
      { questionId: 'q1', selected: 'A' }, // correct +2
      { questionId: 'q2', selected: 'A' }, // wrong -0.5
    ];
    const r = gradeAnswers(questions, answers, 0.5);
    expect(r.correct).toBe(1);
    expect(r.wrong).toBe(1);
    expect(r.score).toBe(1.5);
    expect(r.totalMarks).toBe(6);
  });

  it('does not penalise unanswered questions', () => {
    const r = gradeAnswers(questions, [{ questionId: 'q1', selected: 'A' }], 0.5);
    expect(r.correct).toBe(1);
    expect(r.wrong).toBe(0);
    expect(r.score).toBe(2);
  });

  it('never returns a negative total score', () => {
    const answers: AnswerRow[] = [
      { questionId: 'q1', selected: 'B' },
      { questionId: 'q2', selected: 'A' },
      { questionId: 'q3', selected: 'A' },
    ];
    const r = gradeAnswers(questions, answers, 5);
    expect(r.score).toBe(0);
    expect(r.wrong).toBe(3);
  });
});
