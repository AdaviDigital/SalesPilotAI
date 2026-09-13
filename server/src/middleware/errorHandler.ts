import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: { message: 'Validation failed', details: err.flatten().fieldErrors },
    });
  }

  if (err instanceof AppError) {
    if (!err.isOperational) logger.error({ err }, 'Non-operational AppError');
    return res.status(err.statusCode).json({ error: { message: err.message } });
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : (err as Error)?.message;
  res.status(500).json({ error: { message } });
}
