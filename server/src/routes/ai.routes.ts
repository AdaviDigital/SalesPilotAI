import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as aiController from '../controllers/ai.controller';
import { requireAuth, requireOrganization } from '../middleware/auth';
import { enforceAIUsageLimit } from '../middleware/usageLimit';

const router = Router();
router.use(requireAuth, requireOrganization);

// AI operations can be expensive — a tighter per-org rate limit than the
// general API, independent of subscription plan limits (see billing module).
const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true });
router.use(aiLimiter);
router.use(enforceAIUsageLimit);

router.post('/chat', aiController.chat);
router.get('/conversations', aiController.conversations);
router.get('/conversations/:id', aiController.conversation);

router.post('/leads/:leadId/score', aiController.scoreOneLead);
router.post('/leads/score-all', aiController.scoreAll);

router.post('/deals/:dealId/analyze', aiController.analyzeOneDeal);
router.post('/deals/analyze-all', aiController.analyzeAllDeals);

router.get('/forecast', aiController.forecast);
router.post('/email', aiController.email);
router.post('/summarize', aiController.summarize);
router.post('/activities/:activityId/analyze', aiController.analyzeActivity);

export default router;
