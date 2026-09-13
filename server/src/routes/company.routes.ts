import { Router } from 'express';
import * as companyController from '../controllers/company.controller';
import { requireAuth, requireOrganization } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();
router.use(requireAuth, requireOrganization);

router.get('/', companyController.list);
router.get('/export', companyController.exportCsv);
router.post('/import/preview', upload.single('file'), companyController.previewCsv);
router.post('/import', upload.single('file'), companyController.importCsv);
router.get('/:id', companyController.getOne);
router.post('/', companyController.create);
router.patch('/:id', companyController.update);
router.delete('/:id', companyController.remove);

export default router;
