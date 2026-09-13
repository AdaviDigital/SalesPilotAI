import { z } from 'zod';

export const calendarRangeQuerySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

export type CalendarRangeQuery = z.infer<typeof calendarRangeQuerySchema>;
