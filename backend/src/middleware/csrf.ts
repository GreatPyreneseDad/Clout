import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from './errorHandler';

// Store CSRF tokens in memory (in production, use Redis or similar)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(userId);
    }
  }
}, 5 * 60 * 1000);

export const generateCSRFToken = (userId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour expiry
  
  csrfTokens.set(userId, { token, expires });
  return token;
};

export const csrfProtection = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip CSRF for GET requests and certain endpoints
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Skip CSRF for authentication endpoints
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    return next();
  }

  // Require authentication for CSRF protection
  if (!req.user || !req.user.id) {
    return next(new AppError('Authentication required', 401));
  }

  // Get CSRF token from header or body
  const csrfToken = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!csrfToken) {
    return next(new AppError('CSRF token missing', 403));
  }

  // Validate CSRF token
  const storedData = csrfTokens.get(req.user.id);
  
  if (!storedData || storedData.token !== csrfToken) {
    return next(new AppError('Invalid CSRF token', 403));
  }

  if (storedData.expires < Date.now()) {
    csrfTokens.delete(req.user.id);
    return next(new AppError('CSRF token expired', 403));
  }

  // Token is valid, proceed
  next();
};

// Middleware to inject CSRF token generation function
export const injectCSRFToken = (
  req: Request & { user?: any; csrfToken?: () => string },
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.id) {
    req.csrfToken = () => generateCSRFToken(req.user.id);
  }
  next();
};