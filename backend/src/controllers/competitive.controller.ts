import type { Response } from 'express';
import { leaderboardService, type LeaderboardPeriod } from '@/services/leaderboard.service';
import { rankingService, type RankingScope } from '@/services/ranking.service';
import { quizBattleService } from '@/services/quizBattle.service';
import { sendSuccess } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/interfaces';

export const competitiveController = {
  async leaderboard(req: AuthenticatedRequest, res: Response) {
    const period = (req.query.period as LeaderboardPeriod) ?? 'weekly';
    const courseId = req.query.courseId as string | undefined;
    const data = await leaderboardService.list(period, { courseId });
    return sendSuccess(res, data, 'Leaderboard');
  },

  async myLeaderboardRank(req: AuthenticatedRequest, res: Response) {
    const period = (req.query.period as LeaderboardPeriod) ?? 'weekly';
    const courseId = req.query.courseId as string | undefined;
    const data = await leaderboardService.myRank(req.user!.userId, period, courseId);
    return sendSuccess(res, data, 'Your leaderboard rank');
  },

  async rankings(req: AuthenticatedRequest, res: Response) {
    const scope = (req.query.scope as RankingScope) ?? 'overall';
    const categoryId = req.query.categoryId as string | undefined;
    const data = await rankingService.get(req.user!.userId, scope, categoryId);
    return sendSuccess(res, data, 'Rankings');
  },

  async rankingSummary(req: AuthenticatedRequest, res: Response) {
    const data = await rankingService.summary(req.user!.userId);
    return sendSuccess(res, data, 'Ranking summary');
  },

  async listBattles(req: AuthenticatedRequest, res: Response) {
    const data = await quizBattleService.list(req.user!.userId);
    return sendSuccess(res, data, 'Quiz battles');
  },

  async joinBattle(req: AuthenticatedRequest, res: Response) {
    const data = await quizBattleService.join(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Joined battle');
  },

  async startBattle(req: AuthenticatedRequest, res: Response) {
    const data = await quizBattleService.start(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Battle started');
  },

  async battleLive(req: AuthenticatedRequest, res: Response) {
    const data = await quizBattleService.liveState(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Live battle state');
  },

  async battleAnswer(req: AuthenticatedRequest, res: Response) {
    const data = await quizBattleService.submitAnswer(req.user!.userId, req.params.id, req.body);
    return sendSuccess(res, data, 'Answer submitted');
  },

  async battleHistory(req: AuthenticatedRequest, res: Response) {
    const data = await quizBattleService.history(req.user!.userId);
    return sendSuccess(res, data, 'Battle history');
  },
};
