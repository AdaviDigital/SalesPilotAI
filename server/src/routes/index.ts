import { Router } from 'express';
import authRoutes from './auth.routes';
import leadRoutes from './lead.routes';
import contactRoutes from './contact.routes';
import companyRoutes from './company.routes';
import dealRoutes from './deal.routes';
import pipelineRoutes from './pipeline.routes';
import taskRoutes from './task.routes';
import activityRoutes from './activity.routes';
import calendarRoutes from './calendar.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import aiRoutes from './ai.routes';
import automationRoutes from './automation.routes';
import notificationRoutes from './notification.routes';
import billingRoutes from './billing.routes';
import organizationRoutes from './organization.routes';
import userRoutes from './user.routes';
import fileRoutes from './file.routes';
import noteRoutes from './note.routes';
import searchRoutes from './search.routes';
import customFieldRoutes from './customField.routes';
import docsRoutes from './docs.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
router.use('/docs', docsRoutes);

// Fully implemented
router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/contacts', contactRoutes);
router.use('/companies', companyRoutes);
router.use('/deals', dealRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/tasks', taskRoutes);
router.use('/activities', activityRoutes);
router.use('/calendar', calendarRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/automation', automationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/billing', billingRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/notes', noteRoutes);
router.use('/search', searchRoutes);
router.use('/custom-fields', customFieldRoutes);

export default router;
