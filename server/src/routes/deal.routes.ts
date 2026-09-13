import { Router } from 'express';
import * as dealController from '../controllers/deal.controller';
import { requireAuth, requireOrganization } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireOrganization);

router.get('/', dealController.list);
router.get('/:id', dealController.getOne);
router.post('/', dealController.create);
router.patch('/:id', dealController.update);
router.patch('/:id/move', dealController.move);
router.delete('/:id', dealController.remove);

export default router;
