import { Router } from 'express';
import { competitiveController } from '@/controllers/competitive.controller';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();
router.use(authenticate);

// Leaderboards
router.get('/leaderboard', asyncHandler(competitiveController.leaderboard));
router.get('/leaderboard/me', asyncHandler(competitiveController.myLeaderboardRank));

// Rankings
router.get('/rankings', asyncHandler(competitiveController.rankings));
router.get('/rankings/summary', asyncHandler(competitiveController.rankingSummary));

// Live quiz battles
router.get('/battles', asyncHandler(competitiveController.listBattles));
router.get('/battles/history', asyncHandler(competitiveController.battleHistory));
router.post('/battles/:id/join', asyncHandler(competitiveController.joinBattle));
router.post('/battles/:id/start', asyncHandler(competitiveController.startBattle));
router.get('/battles/:id/live', asyncHandler(competitiveController.battleLive));
router.post('/battles/:id/answer', asyncHandler(competitiveController.battleAnswer));

export { router as competitiveRoutes };
