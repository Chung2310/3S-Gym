import express from 'express';
import Joi from 'joi';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate } from '../middlewares/validate.js';
import { proposal, generation } from '../controllers/aiWorkoutController.js';

const router = express.Router();
router.post('/workout-proposals', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate({ body: Joi.object({ customerId: Joi.string().hex().length(24).required() }) }), proposal);
router.post('/workout-generations', authenticate, authorize('PT'), requireFeature('EXERCISE_LIBRARY'), validate({ body: Joi.object({ customerId: Joi.string().hex().length(24).required(), proposal: Joi.object({ durationWeeks: Joi.number().integer().min(4).max(12).required(), sessionsPerWeek: Joi.number().integer().min(1).max(7).required(), minutesPerSession: Joi.number().integer().min(15).max(240).required(), level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').required(), trainingMethod: Joi.string().required(), trainingSplit: Joi.string().required(), priorityMuscleGroups: Joi.array().items(Joi.string()).required(), restrictions: Joi.array().items(Joi.string()).required() }).required(), additionalRequest: Joi.string().allow('').max(1000) }) }), generation);
export default router;
