import { Router } from 'express';
import * as leadController from '../controllers/lead.controller';
import { requireAuth, requireOrganization } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(requireAuth, requireOrganization);

// Static/specific paths must come before the /:id catch-all to avoid
// "export", "import", "duplicates", or "merge" being parsed as a lead id.
router.get('/', leadController.list);
router.get('/export', leadController.exportCsv);
router.get('/duplicates', leadController.duplicates);
router.post('/merge', leadController.merge);
router.post('/import/preview', upload.single('file'), leadController.previewCsv);
router.post('/import', upload.single('file'), leadController.importCsv);
router.get('/:id', leadController.getOne);
router.post('/', leadController.create);
router.patch('/:id', leadController.update);
router.delete('/:id', leadController.remove);

export default router;
