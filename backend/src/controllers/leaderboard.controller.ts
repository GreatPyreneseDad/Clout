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

    // Get all cappers with their stats
    const capperStats = await Pick.aggregate([
      // Only count verified picks
      { $match: { verifiedOutcome: { $exists: true } } },
      
      // Group by capper
      {
        $group: {
          _id: '$capperId',
          totalPicks: { $sum: 1 },
          correctPicks: {
            $sum: { $cond: ['$verifiedOutcome.isCorrect', 1, 0] }
          }
        }
      },
      
      // Calculate win rate
      {
        $addFields: {
          winRate: {
            $cond: [
              { $eq: ['$totalPicks', 0] },
              0,
              { $divide: ['$correctPicks', '$totalPicks'] }
            ]
          }
        }
      },
      
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      
      // Unwind user array
      { $unwind: '$user' },
      
      // Project final fields
      {
        $project: {
          capperId: '$_id',
          username: '$user.username',
          totalPicks: 1,
          correctPicks: 1,
          winRate: 1,
          followerCount: { $size: '$user.followers' },
          cloutScore: {
            $add: [
              { $multiply: ['$winRate', 70] },
              { $min: [{ $divide: [{ $size: '$user.followers' }, 10] }, 30] }
            ]
          }
        }
      },
      
      // Sort by clout score
      { $sort: { cloutScore: -1 } },
      
      // Paginate
      { $skip: skip },
      { $limit: limit }
    ]);

    // Add rank
    const leaderboard: LeaderboardEntry[] = capperStats.map((stat, index) => ({
      ...stat,
      rank: skip + index + 1,
      winRate: Math.round(stat.winRate * 100) / 100,
      cloutScore: Math.round(stat.cloutScore * 1000) / 1000
    }));

    // Get total count of cappers
    const totalCappers = await User.countDocuments({ role: 'capper' });

    res.status(200).json({
      success: true,
      data: leaderboard,
      pagination: {
        page,
        limit,
        total: totalCappers,
        pages: Math.ceil(totalCappers / limit)
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

    // Get user details
    const user = await User.findById(capperId);
    if (!user || user.role !== 'capper') {
      throw new AppError('Capper not found', 404);
    }

    // Get pick statistics
    const stats = await Pick.aggregate([
      { $match: { capperId: user._id } },
      
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalPicks: { $sum: 1 },
                verifiedPicks: {
                  $sum: { $cond: [{ $ne: ['$verifiedOutcome', null] }, 1, 0] }
                },
                correctPicks: {
                  $sum: { $cond: ['$verifiedOutcome.isCorrect', 1, 0] }
                },
                pendingPicks: {
                  $sum: { 
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$verifiedOutcome', null] },
                          { $gt: ['$fightEvent.date', new Date()] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          byOrganization: [
            {
              $group: {
                _id: '$fightEvent.organization',
                totalPicks: { $sum: 1 },
                correctPicks: {
                  $sum: { $cond: ['$verifiedOutcome.isCorrect', 1, 0] }
                }
              }
            }
          ],
          recentPicks: [
            { $sort: { timestamp: -1 } },
            { $limit: 5 },
            {
              $project: {
                fightEvent: 1,
                prediction: 1,
                timestamp: 1,
                verifiedOutcome: 1
              }
            }
          ]
        }
      }
    ]);

    const overallStats = stats[0].overall[0] || {
      totalPicks: 0,
      verifiedPicks: 0,
      correctPicks: 0,
      pendingPicks: 0
    };

    const winRate = overallStats.verifiedPicks > 0
      ? overallStats.correctPicks / overallStats.verifiedPicks
      : 0;

    const socialScore = Math.min(user.followers.length / 10, 30);
    const cloutScore = (winRate * 70) + socialScore;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          followerCount: user.followers.length,
          followingCount: user.following.length
        },
        stats: {
          ...overallStats,
          winRate: Math.round(winRate * 100) / 100,
          cloutScore: Math.round(cloutScore * 1000) / 1000
        },
        byOrganization: stats[0].byOrganization,
        recentPicks: stats[0].recentPicks
      }
    });
  } catch (error) {
    next(error);
  }
};