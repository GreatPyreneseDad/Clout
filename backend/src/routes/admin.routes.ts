import { Router, Request, Response } from 'express';
import { SportsDataService } from '../services/sportsData.service';

const router = Router();

// Trigger event fetch manually
router.post('/fetch-events', async (req: Request, res: Response) => {
  try {
    const sportsDataService = new SportsDataService();
    const events = await sportsDataService.fetchUpcomingEvents();
    
    res.json({ 
      success: true, 
      message: `Fetched ${events.length} events`,
      events: events.length 
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;