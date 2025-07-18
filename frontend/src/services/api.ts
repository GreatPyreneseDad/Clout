import axios from 'axios';
import type { ApiResponse, User, Pick, LeaderboardEntry, LoginCredentials, RegisterData, AuthResponse } from '@clout/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: (credentials: LoginCredentials) => 
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),
  
  register: (data: RegisterData) => 
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// User services
export const userService = {
  getProfile: (userId: string) => 
    api.get<ApiResponse<User>>(`/users/${userId}`),
  
  followUser: (userId: string) => 
    api.post<ApiResponse<void>>(`/users/${userId}/follow`),
  
  unfollowUser: (userId: string) => 
    api.post<ApiResponse<void>>(`/users/${userId}/unfollow`),
  
  getFollowers: (userId: string) => 
    api.get<ApiResponse<User[]>>(`/users/${userId}/followers`),
  
  getFollowing: (userId: string) => 
    api.get<ApiResponse<User[]>>(`/users/${userId}/following`),
};

// Pick services
export const pickService = {
  getFeed: (page = 1, limit = 20) => 
    api.get<ApiResponse<Pick[]>>('/picks', { params: { page, limit } }),
  
  getCapperPicks: (capperId: string, page = 1, limit = 20) => 
    api.get<ApiResponse<Pick[]>>(`/picks/capper/${capperId}`, { params: { page, limit } }),
  
  createPick: (pickData: Omit<Pick, 'id' | 'capperId' | 'timestamp' | 'likeCount' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Pick>>('/picks', pickData),
  
  likePick: (pickId: string) => 
    api.post<ApiResponse<void>>(`/picks/${pickId}/like`),
  
  unlikePick: (pickId: string) => 
    api.post<ApiResponse<void>>(`/picks/${pickId}/unlike`),
};

// Leaderboard services
export const leaderboardService = {
  getLeaderboard: (period: 'all' | 'month' | 'week' = 'all') => 
    api.get<ApiResponse<LeaderboardEntry[]>>('/leaderboard', { params: { period } }),
};

export default api;