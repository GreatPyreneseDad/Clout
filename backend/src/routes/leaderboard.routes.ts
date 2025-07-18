import { Router } from 'express';
import { getLeaderboard, getCapperStats } from '../controllers/leaderboard.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Apply optional auth to all routes (for personalized data)
router.use(optionalAuth);

// Get top cappers leaderboard
router.get('/', getLeaderboard);

// Get specific capper's stats
router.get('/capper/:capperId', getCapperStats);

export default router;