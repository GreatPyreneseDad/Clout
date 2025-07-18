import { Request } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface LeaderboardEntry {
  capperId: string;
  username: string;
  totalPicks: number;
  correctPicks: number;
  winRate: number;
  followerCount: number;
  cloutScore: number;
  rank: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PickFilters {
  capperId?: string;
  eventDate?: {
    start?: Date;
    end?: Date;
  };
  organization?: string;
  isPending?: boolean;
  isVerified?: boolean;
}