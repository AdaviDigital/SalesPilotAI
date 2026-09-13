import { Router } from 'express';
import * as activityController from '../controllers/activity.controller';
import { requireAuth, requireOrganization } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireOrganization);

router.get('/', activityController.list);
router.post('/', activityController.create);
router.delete('/:id', activityController.remove);

export default router;
