import Joi from 'joi';
import type { RequestValidationSchema } from '../middlewares/validate.js';
import { commonMessages, objectId } from './commonValidator.js';

const params = Joi.object({ id: objectId.required() }).messages(commonMessages);
const planParams = Joi.object({ id: objectId.required(), planId: objectId.required() }).messages(commonMessages);
const classifiedTrackingType = Joi.string().valid('STRENGTH', 'BODYWEIGHT', 'CARDIO', 'INTERVAL', 'MOBILITY');
const prescription = Joi.object().when('trackingType', {
  switch: [
    { is: 'STRENGTH', then: Joi.object({ sets: Joi.number().integer().min(1).required(), reps: Joi.string().allow(''), targetWeight: Joi.number().min(0), targetRpe: Joi.number().min(0).max(10), targetRir: Joi.number().min(0), restSeconds: Joi.number().min(0) }).unknown(false) },
    { is: 'BODYWEIGHT', then: Joi.object({ sets: Joi.number().integer().min(1).required(), reps: Joi.string().allow(''), addedWeight: Joi.number().min(0), targetRpe: Joi.number().min(0).max(10), targetRir: Joi.number().min(0), restSeconds: Joi.number().min(0) }).unknown(false) },
    { is: 'CARDIO', then: Joi.object({ durationMinutes: Joi.number().positive(), distanceKm: Joi.number().positive(), targetPaceSecondsPerKm: Joi.number().positive(), targetHeartRate: Joi.number().positive(), inclinePercent: Joi.number().min(0), targetRpe: Joi.number().min(0).max(10) }).or('durationMinutes', 'distanceKm').unknown(false) },
    { is: 'INTERVAL', then: Joi.object({ rounds: Joi.number().integer().min(1).required(), workSeconds: Joi.number().positive(), restSeconds: Joi.number().min(0), distanceMetersPerRound: Joi.number().positive(), repsPerRound: Joi.number().integer().positive(), targetRpe: Joi.number().min(0).max(10) }).unknown(false) },
    { is: 'MOBILITY', then: Joi.object({ durationMinutes: Joi.number().positive(), reps: Joi.number().integer().positive(), side: Joi.string().valid('LEFT', 'RIGHT', 'BOTH'), targetDiscomfort: Joi.number().min(0).max(10) }).or('durationMinutes', 'reps').unknown(false) },
  ],
});
const exercise = Joi.object({ exerciseId: objectId.optional(), name: Joi.string().trim().required(), trackingType: classifiedTrackingType.required(), prescription: prescription.required(), sets: Joi.number().integer().min(1).optional(), reps: Joi.string().allow('').optional(), weight: Joi.string().allow('').optional(), rpe: Joi.number().min(0).max(10).optional(), rir: Joi.number().min(0).optional(), tempo: Joi.string().allow('').optional(), restSeconds: Joi.number().min(0).optional(), notes: Joi.string().allow('').optional() });
const planSession = Joi.object({ name: Joi.string().trim().required(), exercises: Joi.array().items(exercise).required() });
const scheduled = exercise.keys({ dayNumber: Joi.number().integer().min(1).max(365).required(), startMinute: Joi.number().integer().min(0).max(1425).required(), durationMinutes: Joi.number().integer().min(15).max(1440).required() });
const unscheduled = exercise.keys({ durationMinutes: Joi.number().integer().min(15).max(1440).required() });

export const listCustomerPlansSchema: RequestValidationSchema = { params };
export const assignCustomerPlanSchema: RequestValidationSchema = { params, body: Joi.object({ templateId: objectId.required() }).messages(commonMessages) };
export const getCustomerPlanSchema: RequestValidationSchema = { params: planParams };
export const updateCustomerPlanSchema: RequestValidationSchema = { params: planParams, body: Joi.object({ title: Joi.string().trim().min(1), goal: Joi.string().trim().min(1), level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED'), durationDays: Joi.number().integer().min(1).max(365), muscleGroups: Joi.array().items(Joi.string().trim().min(1).max(100)).max(20), defaultSets: Joi.number().integer().min(1).max(100), defaultReps: Joi.string().trim().allow('').max(100), defaultWeight: Joi.string().trim().allow('').max(100), defaultTempo: Joi.string().trim().allow('').max(100), technicalNotes: Joi.string().trim().allow('').max(2000), scheduledExercises: Joi.array().items(scheduled), unscheduledExercises: Joi.array().items(unscheduled), sessions: Joi.array().items(planSession) }).min(1).messages(commonMessages) };
