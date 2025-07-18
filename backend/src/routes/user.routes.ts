import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth';
import {
  register,
  login,
  getProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} from '../controllers/user.controller';

const router = Router();

// Validation middleware
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscore only'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['capper', 'user'])
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Follow/Unfollow routes
router.post('/:userId/follow', followUser);
router.delete('/:userId/follow', unfollowUser);

// Get followers/following lists
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;