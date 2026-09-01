import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate } from '../middlewares/validate.js';
import { proposal, generation, exerciseGeneration } from '../controllers/aiWorkoutController.js';
import {
  workoutGenerationRequestSchema,
  workoutProposalRequestSchema,
} from '../validators/aiWorkoutValidator.js';
import { exerciseGenerationRequestSchema } from '../validators/aiExerciseValidator.js';

const router = express.Router();
router.post('/exercise-generations', authenticate, authorize('ADMIN', 'PT'), requireFeature('EXERCISE_LIBRARY'), validate(exerciseGenerationRequestSchema), exerciseGeneration);
router.post('/workout-proposals', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate(workoutProposalRequestSchema), proposal);
router.post('/workout-generations', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate(workoutGenerationRequestSchema), generation);
export default router;
