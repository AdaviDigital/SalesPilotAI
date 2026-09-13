import { Router } from 'express';
import * as contactController from '../controllers/contact.controller';
import { requireAuth, requireOrganization } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(requireAuth, requireOrganization);

router.get('/', contactController.list);
router.get('/export', contactController.exportCsv);
router.post('/import/preview', upload.single('file'), contactController.previewCsv);
router.post('/import', upload.single('file'), contactController.importCsv);
router.get('/:id', contactController.getOne);
router.post('/', contactController.create);
router.patch('/:id', contactController.update);
router.delete('/:id', contactController.remove);

export default router;
