import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { requireAuth, requireOrganization } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireOrganization);

router.get('/', taskController.list);
router.get('/:id', taskController.getOne);
router.post('/', taskController.create);
router.patch('/:id', taskController.update);
router.delete('/:id', taskController.remove);

export default router;
