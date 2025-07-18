import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  message: string;
  statusCode: number;
  errors?: any;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: ErrorResponse = {
    message: 'Internal Server Error',
    statusCode: 500
  };

  if (err instanceof AppError) {
    error.message = err.message;
    error.statusCode = err.statusCode;
    if (err.errors) {
      error.errors = err.errors;
    }
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    error.message = 'Validation Error';
    error.statusCode = 400;
    error.errors = Object.values((err as any).errors).map((e: any) => e.message);
  } else if (err.name === 'CastError') {
    // Mongoose cast error
    error.message = 'Invalid ID format';
    error.statusCode = 400;
  } else if ((err as any).code === 11000) {
    // Mongoose duplicate key error
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
    const field = Object.keys((err as any).keyValue)[0];
    error.errors = [`${field} already exists`];
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: (err as Error).stack })
  });
};