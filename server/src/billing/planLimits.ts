import type { PlanTier } from '@prisma/client';

export interface PlanLimits {
  seatLimit: number;
  aiRequestLimit: number; // per month
  label: string;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    seatLimit: 2,
    aiRequestLimit: 20,
    label: 'Free',
    features: ['Basic CRM', 'Leads, contacts, companies, deals', 'Single pipeline'],
  },
  STARTER: {
    seatLimit: 5,
    aiRequestLimit: 200,
    label: 'Starter',
    features: ['Everything in Free', 'AI lead scoring', 'AI email assistant', 'Task automation'],
  },
  PROFESSIONAL: {
    seatLimit: 20,
    aiRequestLimit: 1000,
    label: 'Professional',
    features: ['Everything in Starter', 'AI deal intelligence', 'Forecasting', 'Advanced automation', 'Custom reports'],
  },
  ENTERPRISE: {
    seatLimit: 999,
    aiRequestLimit: 10000,
    label: 'Enterprise',
    features: ['Everything in Professional', 'Unlimited teams', 'Enterprise controls', 'Priority support'],
  },
};
