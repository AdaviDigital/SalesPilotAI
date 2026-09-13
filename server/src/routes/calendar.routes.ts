import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { calendarRangeQuerySchema } from '../schemas/calendar.schema';
import { getCalendarEvents } from '../services/calendar.service';
import { requireAuth, requireOrganization } from '../middleware/auth';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end } = calendarRangeQuerySchema.parse(req.query);
    const events = await getCalendarEvents(req.organizationId!, new Date(start), new Date(end));
    res.json({ events });
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);
router.get('/', list);

export default router;
