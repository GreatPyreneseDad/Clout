import { Router } from 'express';
import { body } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth';
import {
  createPick,
  getPick,
  updatePick,
  deletePick,
  getPicksByUser,
  getAllPicks,
  likePick,
  unlikePick
} from '../controllers/pick.controller';

const router = Router();

// Validation middleware
const pickValidation = [
  body('fightEvent.eventName').notEmpty().withMessage('Event name is required'),
  body('fightEvent.date').isISO8601().withMessage('Valid date is required'),
  body('fightEvent.fighters').isArray({ min: 2, max: 2 }).withMessage('Exactly 2 fighters required'),
  body('fightEvent.organization').isIn(['UFC', 'Bellator', 'ONE', 'PFL', 'Boxing', 'Other']),
  body('prediction.winner').notEmpty().withMessage('Winner prediction is required'),
  body('prediction.confidence').isInt({ min: 1, max: 10 }).withMessage('Confidence must be 1-10'),
  body('analysis').optional().isLength({ max: 2000 })
];

// Public routes
router.get('/', getAllPicks);
router.get('/:id', getPick);
router.get('/user/:userId', getPicksByUser);

// Protected routes (require authentication)
router.use(protect);

// Capper-only routes
router.post('/', restrictTo('capper'), pickValidation, createPick);
router.patch('/:id', restrictTo('capper'), updatePick);
router.delete('/:id', restrictTo('capper'), deletePick);

// User interaction routes
router.post('/:id/like', likePick);
router.delete('/:id/like', unlikePick);

export default router;