import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
  );
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation Error', 400, errors.array());
    }

    const { username, email, password, role } = req.body;

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'user'
    });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation Error', 400, errors.array());
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        cloutScore: user.cloutScore
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id)
      .populate('followers', 'username')
      .populate('following', 'username');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Prevent updating certain fields
    const fieldsToUpdate = { ...req.body };
    delete fieldsToUpdate.password;
    delete fieldsToUpdate.email;
    delete fieldsToUpdate.role;
    delete fieldsToUpdate.cloutScore;
    delete fieldsToUpdate.followers;
    delete fieldsToUpdate.following;

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const followUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;

    // Can't follow yourself
    if (userId === currentUserId.toString()) {
      throw new AppError('Cannot follow yourself', 400);
    }

    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      throw new AppError('User not found', 404);
    }

    // Check if already following
    if (req.user!.following.includes(userId as any)) {
      throw new AppError('Already following this user', 400);
    }

    // Update both users
    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $push: { followers: currentUserId }
    });

    res.status(200).json({
      success: true,
      message: `Now following ${userToFollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!._id;

    // Check if user exists
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      throw new AppError('User not found', 404);
    }

    // Check if following
    if (!req.user!.following.includes(userId as any)) {
      throw new AppError('Not following this user', 400);
    }

    // Update both users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId }
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId }
    });

    res.status(200).json({
      success: true,
      message: `Unfollowed ${userToUnfollow.username}`
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username cloutScore',
        options: {
          limit,
          skip: (page - 1) * limit
        }
      });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user.followers,
      pagination: {
        page,
        limit,
        total: user.followerCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username cloutScore',
        options: {
          limit,
          skip: (page - 1) * limit
        }
      });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user.following,
      pagination: {
        page,
        limit,
        total: user.followingCount
      }
    });
  } catch (error) {
    next(error);
  }
};