// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'capper' | 'user';
  cloutScore: number;
  followerCount?: number;
  followingCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Fight event types
export interface FightEvent {
  eventName: string;
  date: string;
  fighters: string[];
  organization:
    | 'UFC'
    | 'Bellator'
    | 'ONE'
    | 'PFL'
    | 'Boxing'
    | 'NFL'
    | 'NBA'
    | 'MLB'
    | 'Soccer'
    | 'Other';
}

// Prediction types
export interface Prediction {
  winner: string;
  method?: 'KO/TKO' | 'Submission' | 'Decision' | 'Draw' | 'No Contest';
  round?: number;
  odds?: number;
  confidence: number;
}

// Verified outcome types
export interface VerifiedOutcome {
  winner: string;
  method: string;
  round?: number;
  verifiedAt: string;
  isCorrect: boolean;
}

// Pick types
export interface Pick {
  id: string;
  capperId: string | User;
  fightEvent: FightEvent;
  prediction: Prediction;
  analysis?: string;
  timestamp: string;
  verifiedOutcome?: VerifiedOutcome;
  likeCount: number;
  isActive: boolean;
  isPending?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Leaderboard entry
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

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: 'capper' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}