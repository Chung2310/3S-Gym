import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { requireFeature } from '../middlewares/requireFeature.js';
import { validate } from '../middlewares/validate.js';
import * as c from '../controllers/contentDraftController.js';
import { contentDraftSchema } from '../validators/knowledgeValidator.js';

const router = express.Router();

router.post('/nutrition', authenticate, authorize('PT'), requireFeature('NUTRITION_AI'), validate(contentDraftSchema), c.nutrition);
router.post('/workout', authenticate, authorize('PT'), requireFeature('PT_ASSISTANT'), validate(contentDraftSchema), c.workout);
router.post('/roadmap', authenticate, authorize('PT'), requireFeature('ROADMAP'), validate(contentDraftSchema), c.roadmap);

export default router;
