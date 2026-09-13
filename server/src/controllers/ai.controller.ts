import type { NextFunction, Request, Response } from 'express';
import { chatMessageSchema, generateEmailSchema, summarizeCustomerSchema } from '../schemas/ai.schema';
import { sendChatMessage, listConversations, getConversation } from '../ai/chat';
import { scoreLead, scoreAllLeads } from '../ai/scoring';
import { analyzeDeal, analyzeAllOpenDeals } from '../ai/dealIntelligence';
import { getForecast } from '../ai/forecasting';
import { generateEmail } from '../ai/emailAssistant';
import { summarizeCustomer } from '../ai/customerSummary';
import { analyzeConversation } from '../ai/conversationAnalysis';
import { AppError } from '../utils/AppError';
import { AIUnavailableError } from '../ai/AIProvider';

function handleAIError(err: unknown, next: NextFunction) {
  if (err instanceof AIUnavailableError) return next(new AppError(err.message, 503));
  if (err instanceof Error && err.message.endsWith('not found')) return next(new AppError(err.message, 404));
  next(err);
}

export async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    const input = chatMessageSchema.parse(req.body);
    const result = await sendChatMessage({ organizationId: req.organizationId!, userId: req.user!.id, ...input });
    res.json(result);
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function conversations(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listConversations(req.organizationId!, req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function conversation(req: Request, res: Response, next: NextFunction) {
  try {
    const convo = await getConversation(req.organizationId!, req.user!.id, req.params.id);
    if (!convo) throw new AppError('Conversation not found', 404);
    res.json(convo);
  } catch (err) {
    next(err);
  }
}

export async function scoreOneLead(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await scoreLead(req.organizationId!, req.params.leadId));
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function scoreAll(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await scoreAllLeads(req.organizationId!));
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function analyzeOneDeal(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyzeDeal(req.organizationId!, req.params.dealId));
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function analyzeAllDeals(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyzeAllOpenDeals(req.organizationId!));
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function forecast(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getForecast(req.organizationId!));
  } catch (err) {
    next(err);
  }
}

export async function email(req: Request, res: Response, next: NextFunction) {
  try {
    const input = generateEmailSchema.parse(req.body);
    res.json(await generateEmail({ organizationId: req.organizationId!, userId: req.user!.id, ...input }));
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function summarize(req: Request, res: Response, next: NextFunction) {
  try {
    const input = summarizeCustomerSchema.parse(req.body);
    const summary = await summarizeCustomer(req.organizationId!, input.entity, input.id, req.user!.id);
    res.json({ summary });
  } catch (err) {
    handleAIError(err, next);
  }
}

export async function analyzeActivity(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyzeConversation(req.organizationId!, req.params.activityId, req.user!.id));
  } catch (err) {
    handleAIError(err, next);
  }
}
