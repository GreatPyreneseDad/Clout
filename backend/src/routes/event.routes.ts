import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import {
  getEvents,
  getEventById,
  refreshEvents,
  updateEventResults
} from '../controllers/event.controller';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:eventId', getEventById);

// Admin routes (in production, add admin role)
router.post('/refresh', protect, refreshEvents);
router.post('/:eventId/results', protect, updateEventResults);

export default router;