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

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (organization) query.organization = organization;

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