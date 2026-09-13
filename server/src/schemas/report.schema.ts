import { z } from 'zod';

export const reportConfigSchema = z.object({
  metric: z.enum(['revenue', 'deal_count', 'lead_count', 'conversion_rate', 'activity_count']),
  dimension: z.enum(['owner', 'source', 'industry', 'stage', 'month']),
  dateRange: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'this_quarter', 'this_year', 'all_time']).default('last_30_days'),
  filters: z.record(z.string()).optional(),
});

export const createReportSchema = z.object({
  name: z.string().min(1).max(160),
  config: reportConfigSchema,
});

export type ReportConfig = z.infer<typeof reportConfigSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
