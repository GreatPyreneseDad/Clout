import { Response, NextFunction, Request } from 'express';
import Pick from '../models/Pick';
import User from '../models/User';
import { LeaderboardEntry } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * limit;

    // Simple approach - just get cappers with stats
    const cappers = await User.find({ role: 'capper', 'stats.totalPicks': { $gt: 0 } })
      .select('username stats')
      .sort({ 'stats.cloutScore': -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: 'capper', 'stats.totalPicks': { $gt: 0 } });

    const leaderboard = cappers.map((capper, index) => ({
      rank: skip + index + 1,
      capperId: capper._id,
      username: capper.username,
      totalPicks: capper.stats?.totalPicks || 0,
      wins: capper.stats?.wins || 0,
      losses: capper.stats?.losses || 0,
      winRate: capper.stats?.winRate || 0,
      cloutScore: capper.stats?.cloutScore || 0
    }));

    res.status(200).json({
      success: true,
      data: leaderboard,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCapperStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { capperId } = req.params;
    
    const capper = await User.findOne({ 
      _id: capperId, 
      role: 'capper' 
    }).select('username stats');
    
    if (!capper) {
      throw new AppError('Capper not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: {
        capperId: capper._id,
        username: capper.username,
        totalPicks: capper.stats?.totalPicks || 0,
        wins: capper.stats?.wins || 0,
        losses: capper.stats?.losses || 0,
        winRate: capper.stats?.winRate || 0,
        cloutScore: capper.stats?.cloutScore || 0
      }
    });
  } catch (error) {
    next(error);
  }
};