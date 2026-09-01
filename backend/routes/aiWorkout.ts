import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate } from '../middlewares/validate.js';
import { proposal, generation } from '../controllers/aiWorkoutController.js';
import {
  workoutGenerationRequestSchema,
  workoutProposalRequestSchema,
} from '../validators/aiWorkoutValidator.js';

const router = express.Router();
router.post('/workout-proposals', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate(workoutProposalRequestSchema), proposal);
router.post('/workout-generations', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate(workoutGenerationRequestSchema), generation);
export default router;
