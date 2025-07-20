import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Pick from '../models/Pick';
import { AuthRequest, PickFilters } from '../types';
import { AppError } from '../middleware/errorHandler';

export const createPick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation Error', 400, errors.array());
    }

    const pick = await Pick.create({
      capperId: req.user!._id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: pick
    });
  } catch (error) {
    next(error);
  }
};

export const getPick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pick = await Pick.findById(req.params.id)
      .populate('capperId', 'username cloutScore');

    if (!pick) {
      throw new AppError('Pick not found', 404);
    }

    res.status(200).json({
      success: true,
      data: pick
    });
  } catch (error) {
    next(error);
  }
};

export const updatePick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pick = await Pick.findById(req.params.id);

    if (!pick) {
      throw new AppError('Pick not found', 404);
    }

    // Check ownership
    if (pick.capperId.toString() !== (req.user!._id as any).toString()) {
      throw new AppError('Not authorized to update this pick', 403);
    }

    // Prevent updates if already verified
    if (pick.verifiedOutcome) {
      throw new AppError('Cannot update verified pick', 400);
    }

    const updatedPick = await Pick.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedPick
    });
  } catch (error) {
    next(error);
  }
};

export const deletePick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pick = await Pick.findById(req.params.id);

    if (!pick) {
      throw new AppError('Pick not found', 404);
    }

    // Check ownership
    if (pick.capperId.toString() !== (req.user!._id as any).toString()) {
      throw new AppError('Not authorized to delete this pick', 403);
    }

    await pick.deleteOne();

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPicks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    // Add filters
    if (req.query.organization) {
      filter['fightEvent.organization'] = req.query.organization;
    }
    
    if (req.query.pending === 'true') {
      filter['fightEvent.date'] = { $gt: new Date() };
      filter.verifiedOutcome = { $exists: false };
    }

    const picks = await Pick.find(filter)
      .populate('capperId', 'username cloutScore')
      .sort('-timestamp')
      .skip(skip)
      .limit(limit);

    const total = await Pick.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: picks,
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

export const getPicksByUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const picks = await Pick.find({ capperId: req.params.userId })
      .populate('capperId', 'username cloutScore')
      .sort('-timestamp')
      .skip(skip)
      .limit(limit);

    const total = await Pick.countDocuments({ capperId: req.params.userId });

    res.status(200).json({
      success: true,
      data: picks,
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

export const likePick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pick = await Pick.findById(req.params.id);

    if (!pick) {
      throw new AppError('Pick not found', 404);
    }

    // Check if already liked
    if (pick.likes.includes(req.user!._id as any)) {
      throw new AppError('Pick already liked', 400);
    }

    pick.likes.push(req.user!._id as any);
    await pick.save();

    res.status(200).json({
      success: true,
      data: pick
    });
  } catch (error) {
    next(error);
  }
};

export const unlikePick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pick = await Pick.findById(req.params.id);

    if (!pick) {
      throw new AppError('Pick not found', 404);
    }

    const likeIndex = pick.likes.indexOf(req.user!._id as any);
    if (likeIndex === -1) {
      throw new AppError('Pick not liked', 400);
    }

    pick.likes.splice(likeIndex, 1);
    await pick.save();

    res.status(200).json({
      success: true,
      data: pick
    });
  } catch (error) {
    next(error);
  }
};