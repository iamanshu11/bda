import { CorrectOption } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { gamificationService } from '@/services/gamification.service';

function liveLeaderboard(
  participants: {
    userId: string;
    score: number;
    user: { name: string; avatarUrl: string | null };
  }[],
) {
  return [...participants]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      name: p.user.name,
      avatarUrl: p.user.avatarUrl,
      score: p.score,
    }));
}

type LeaderboardEntry = ReturnType<typeof liveLeaderboard>[number];

/** Shape returned by `liveState` (explicit — the method self-references). */
interface LiveBattleState {
  id: string;
  title: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  timePerQuestion: number;
  timeRemainingMs: number;
  currentQuestion:
    | { id: string; question: string; options: { A: string; B: string; C: string; D: string }; answered: boolean }
    | null;
  leaderboard: LeaderboardEntry[];
  myParticipant: { score: number; rank: number | null; xpEarned: number; finished: boolean } | null;
  winner: LeaderboardEntry | null;
}

export const quizBattleService = {
  async list(userId: string) {
    const battles = await prisma.quizBattle.findMany({
      where: { status: { in: ['LOBBY', 'LIVE'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { title: true } },
        category: { select: { name: true } },
        _count: { select: { participants: true, questions: true } },
        participants: { where: { userId }, select: { id: true } },
      },
      take: 20,
    });

    return battles.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      status: b.status,
      course: b.course?.title ?? null,
      category: b.category?.name ?? null,
      playerCount: b._count.participants,
      questionCount: b._count.questions,
      xpRewardWinner: b.xpRewardWinner,
      xpRewardParticipant: b.xpRewardParticipant,
      joined: b.participants.length > 0,
      scheduledAt: b.scheduledAt,
    }));
  },

  async join(userId: string, battleId: string) {
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: { _count: { select: { participants: true } } },
    });
    if (!battle) throw ApiError.notFound('Battle not found.');
    if (battle.status === 'FINISHED' || battle.status === 'CANCELLED') {
      throw ApiError.badRequest('This battle has ended.');
    }
    if (battle._count.participants >= battle.maxPlayers) {
      throw ApiError.conflict('Battle is full.');
    }

    await prisma.quizBattleParticipant.upsert({
      where: { battleId_userId: { battleId, userId } },
      update: {},
      create: { battleId, userId },
    });

    return { joined: true, battleId };
  },

  async start(userId: string, battleId: string) {
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: { participants: true, questions: { orderBy: { order: 'asc' } } },
    });
    if (!battle) throw ApiError.notFound('Battle not found.');
    if (!battle.participants.some((p) => p.userId === userId)) {
      throw ApiError.forbidden('Join the battle first.');
    }
    if (battle.status !== 'LOBBY') throw ApiError.badRequest('Battle already started or finished.');
    if (battle.questions.length === 0) throw ApiError.badRequest('Battle has no questions.');

    await prisma.quizBattle.update({
      where: { id: battleId },
      data: {
        status: 'LIVE',
        startedAt: new Date(),
        currentQuestionIndex: 0,
        questionStartedAt: new Date(),
      },
    });

    return { started: true };
  },

  /** Live battle state — poll this during LIVE battles. */
  async liveState(userId: string, battleId: string): Promise<LiveBattleState> {
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            answers: true,
          },
        },
      },
    });
    if (!battle) throw ApiError.notFound('Battle not found.');

    const me = battle.participants.find((p) => p.userId === userId);
    const qIndex = battle.currentQuestionIndex;
    const currentQ = battle.questions[qIndex] ?? null;

    const timePerQ = battle.timePerQuestion * 1000;
    const elapsed = battle.questionStartedAt ? Date.now() - battle.questionStartedAt.getTime() : 0;
    const timeRemainingMs = Math.max(0, timePerQ - elapsed);

    // Auto-advance question when time expires (any poll can trigger)
    if (
      battle.status === 'LIVE' &&
      currentQ &&
      timeRemainingMs === 0 &&
      qIndex < battle.questions.length - 1
    ) {
      await prisma.quizBattle.update({
        where: { id: battleId },
        data: { currentQuestionIndex: qIndex + 1, questionStartedAt: new Date() },
      });
      return this.liveState(userId, battleId);
    }

    // Finish battle when last question time elapsed or all answered
    if (battle.status === 'LIVE' && currentQ && qIndex === battle.questions.length - 1 && timeRemainingMs === 0) {
      await this.finishBattle(battleId);
      return this.liveState(userId, battleId);
    }

    const myAnswer = me?.answers.find((a) => a.questionId === currentQ?.id);

    return {
      id: battle.id,
      title: battle.title,
      status: battle.status,
      currentQuestionIndex: qIndex,
      totalQuestions: battle.questions.length,
      timePerQuestion: battle.timePerQuestion,
      timeRemainingMs,
      currentQuestion: currentQ
        ? {
            id: currentQ.id,
            question: currentQ.question,
            options: { A: currentQ.optionA, B: currentQ.optionB, C: currentQ.optionC, D: currentQ.optionD },
            answered: Boolean(myAnswer),
          }
        : null,
      leaderboard: liveLeaderboard(battle.participants),
      myParticipant: me
        ? { score: me.score, rank: me.rank, xpEarned: me.xpEarned, finished: Boolean(me.finishedAt) }
        : null,
      winner: battle.status === 'FINISHED'
        ? liveLeaderboard(battle.participants)[0] ?? null
        : null,
    };
  },

  async submitAnswer(
    userId: string,
    battleId: string,
    input: { questionId: string; selected: CorrectOption; timeMs?: number },
  ) {
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        participants: { where: { userId } },
      },
    });
    if (!battle || battle.status !== 'LIVE') throw ApiError.badRequest('Battle is not live.');
    const participant = battle.participants[0];
    if (!participant) throw ApiError.forbidden('Join the battle first.');

    const qIndex = battle.currentQuestionIndex;
    const currentQ = battle.questions[qIndex];
    if (!currentQ || currentQ.id !== input.questionId) {
      throw ApiError.badRequest('This is not the active question.');
    }

    const question = await prisma.quizBattleQuestion.findUnique({ where: { id: input.questionId } });
    if (!question) throw ApiError.notFound('Question not found.');

    const isCorrect = question.correctOption === input.selected;
    const points = isCorrect ? 10 + Math.max(0, Math.floor((battle.timePerQuestion * 1000 - (input.timeMs ?? 0)) / 1000)) : 0;

    await prisma.quizBattleAnswer.upsert({
      where: { participantId_questionId: { participantId: participant.id, questionId: input.questionId } },
      update: {},
      create: {
        participantId: participant.id,
        questionId: input.questionId,
        selected: input.selected,
        isCorrect,
        timeMs: input.timeMs ?? 0,
      },
    });

    await prisma.quizBattleParticipant.update({
      where: { id: participant.id },
      data: { score: { increment: points } },
    });

    // Advance if all participants answered current question
    const allParts = await prisma.quizBattleParticipant.findMany({
      where: { battleId },
      include: { answers: { where: { questionId: input.questionId } } },
    });
    const allAnswered = allParts.every((p) => p.answers.length > 0);
    if (allAnswered) {
      if (qIndex < battle.questions.length - 1) {
        await prisma.quizBattle.update({
          where: { id: battleId },
          data: { currentQuestionIndex: qIndex + 1, questionStartedAt: new Date() },
        });
      } else {
        await this.finishBattle(battleId);
      }
    }

    return { isCorrect, points, correctOption: question.correctOption };
  },

  async finishBattle(battleId: string) {
    const battle = await prisma.quizBattle.findUnique({
      where: { id: battleId },
      include: { participants: { include: { user: true } } },
    });
    if (!battle || battle.status === 'FINISHED') return;

    const ranked = [...battle.participants].sort((a, b) => b.score - a.score);

    for (let i = 0; i < ranked.length; i += 1) {
      const p = ranked[i];
      const rank = i + 1;
      const isWinner = rank === 1;
      const xpAmount = isWinner ? battle.xpRewardWinner : battle.xpRewardParticipant;
      const action = isWinner ? 'QUIZ_BATTLE_WON' : 'QUIZ_BATTLE_PARTICIPATED';

      await prisma.quizBattleParticipant.update({
        where: { id: p.id },
        data: { rank, xpEarned: xpAmount, finishedAt: new Date() },
      });

      await gamificationService.awardXp(p.userId, action, battleId, xpAmount);
    }

    await prisma.quizBattle.update({
      where: { id: battleId },
      data: { status: 'FINISHED', endedAt: new Date() },
    });
  },

  async history(userId: string) {
    const parts = await prisma.quizBattleParticipant.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      take: 10,
      include: {
        battle: { select: { title: true, status: true, endedAt: true } },
      },
    });
    return parts.map((p) => ({
      battleId: p.battleId,
      title: p.battle.title,
      status: p.battle.status,
      score: p.score,
      rank: p.rank,
      xpEarned: p.xpEarned,
      endedAt: p.battle.endedAt,
    }));
  },
};
