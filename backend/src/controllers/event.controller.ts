import { Request, Response, NextFunction } from 'express';
import Event from '../models/Event';
import { SportsDataService } from '../services/sportsData.service';
import { AppError } from '../middleware/errorHandler';

const sportsDataService = new SportsDataService();

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, organization } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validate pagination parameters
    if (page < 1 || page > 100) {
      throw new AppError('Invalid page number', 400);
    }
    if (limit < 1 || limit > 100) {
      throw new AppError('Invalid limit', 400);
    }

    // Build query with sanitization
    const query: any = {};
    
    // Validate and sanitize status parameter
    if (status) {
      const allowedStatuses = ['pending', 'active', 'completed', 'cancelled'];
      const statusStr = String(status);
      if (!allowedStatuses.includes(statusStr)) {
        throw new AppError('Invalid status parameter', 400);
      }
      query.status = statusStr;
    }
    
    // Validate and sanitize organization parameter
    if (organization) {
      const organizationStr = String(organization);
      // Only allow alphanumeric characters, spaces, and hyphens
      if (!/^[a-zA-Z0-9\s-]+$/.test(organizationStr)) {
        throw new AppError('Invalid organization parameter', 400);
      }
      query.organization = organizationStr;
    }

    // Fetch events with pagination
    const events = await Event.find(query)
      .sort({ eventDate: 1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
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

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      throw new AppError('Invalid event ID format', 400);
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const refreshEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Fetch latest events from external API
    const events = await sportsDataService.fetchUpcomingEvents();

    res.status(200).json({
      success: true,
      message: `Refreshed ${events.length} events`,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

export const updateEventResults = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      throw new AppError('Invalid event ID format', 400);
    }
    
    const event = await sportsDataService.fetchEventResults(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Event results updated',
      data: event
    });
  } catch (error) {
    next(error);
  }
};