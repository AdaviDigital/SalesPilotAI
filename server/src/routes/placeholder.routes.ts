import { Router } from 'express';
import { requireAuth, requireOrganization } from '../middleware/auth';

/**
 * Scaffolds the remaining /api routes so the full API surface described in
 * the architecture (contacts, companies, deals, pipelines, activities,
 * tasks, calendar, analytics, reports, ai, automation, notifications,
 * billing, files) is reachable and tenant-scoped from day one.
 *
 * Each of these gets built out module-by-module following the exact
 * repository → service → controller → routes pattern used in
 * lead.repository.ts / lead.service.ts / lead.controller.ts / lead.routes.ts.
 * This file is replaced one router at a time, not rewritten wholesale.
 */
export function placeholderRouter(moduleName: string) {
  const router = Router();
  router.use(requireAuth, requireOrganization);
  router.all('*', (req, res) => {
    res.status(501).json({
      error: {
        message: `${moduleName} module not yet implemented — scaffolded per Phase ${'N'} of the build plan.`,
      },
    });
  });
  return router;
}
