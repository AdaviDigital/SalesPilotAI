import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';

const router = Router();

const specPath = path.resolve(process.cwd(), 'openapi.yaml');
const spec = YAML.parse(fs.readFileSync(specPath, 'utf-8'));

router.use('/', swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: 'SalesPilot AI API Docs' }));
router.get('/openapi.json', (_req, res) => res.json(spec));

export default router;
