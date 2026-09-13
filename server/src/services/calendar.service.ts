import * as taskRepo from '../repositories/task.repository';
import * as activityRepo from '../repositories/activity.repository';

export type CalendarEventType = 'task' | 'call' | 'meeting';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  at: Date;
  relatedTo: string | null;
  priority?: string;
  status?: string;
}

export async function getCalendarEvents(organizationId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
  const [tasks, activities] = await Promise.all([
    taskRepo.listInRange(organizationId, start, end),
    activityRepo.listInRange(organizationId, start, end),
  ]);

  const taskEvents: CalendarEvent[] = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: `task_${t.id}`,
      type: 'task',
      title: t.title,
      at: t.dueDate as Date,
      relatedTo: t.deal?.name ?? (t.lead ? `${t.lead.firstName} ${t.lead.lastName}` : null) ?? (t.contact ? `${t.contact.firstName} ${t.contact.lastName}` : null),
      priority: t.priority,
      status: t.status,
    }));

  const activityEvents: CalendarEvent[] = activities.map((a) => ({
    id: `activity_${a.id}`,
    type: a.type === 'CALL' ? 'call' : 'meeting',
    title: a.subject,
    at: a.occurredAt,
    relatedTo: a.deal?.name ?? (a.lead ? `${a.lead.firstName} ${a.lead.lastName}` : null) ?? (a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : null),
  }));

  return [...taskEvents, ...activityEvents].sort((a, b) => a.at.getTime() - b.at.getTime());
}
