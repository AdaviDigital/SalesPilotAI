import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import * as notificationService from '../services/notification.service';
import { requireAuth, requireOrganization } from '../middleware/auth';
import { AppError } from '../utils/AppError';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const [items, unread] = await Promise.all([
      notificationService.listNotifications(req.organizationId!, req.user!.id, unreadOnly),
      notificationService.unreadCount(req.organizationId!, req.user!.id),
    ]);
    res.json({ items, unreadCount: unread });
  } catch (err) {
    next(err);
  }
}

async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await notificationService.markRead(req.organizationId!, req.user!.id, req.params.id);
    if (!updated) throw new AppError('Notification not found', 404);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllRead(req.organizationId!, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);
router.get('/', list);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;
