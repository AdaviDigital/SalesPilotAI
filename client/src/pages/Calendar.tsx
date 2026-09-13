import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Phone, Users, ListTodo } from 'lucide-react';
import { api } from '@/lib/api';

interface CalendarEvent {
  id: string;
  type: 'task' | 'call' | 'meeting';
  title: string;
  at: string;
  relatedTo: string | null;
}

const typeStyles: Record<string, { icon: typeof Phone; className: string }> = {
  task: { icon: ListTodo, className: 'bg-blue-100 text-blue-700' },
  call: { icon: Phone, className: 'bg-emerald-100 text-emerald-700' },
  meeting: { icon: Users, className: 'bg-violet-100 text-violet-700' },
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export function Calendar() {
  const [cursor, setCursor] = useState(new Date());

  const rangeStart = startOfMonth(cursor);
  const rangeEnd = endOfMonth(cursor);

  const { data } = useQuery({
    queryKey: ['calendar', rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () =>
      (await api.get('/calendar', { params: { start: rangeStart.toISOString(), end: rangeEnd.toISOString() } })).data
        .events as CalendarEvent[],
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    (data ?? []).forEach((event) => {
      const key = new Date(event.at).toDateString();
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [data]);

  const gridDays = useMemo(() => {
    const firstDayOffset = rangeStart.getDay();
    const daysInMonth = rangeEnd.getDate();
    const days: (Date | null)[] = Array(firstDayOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return days;
  }, [cursor, rangeEnd, rangeStart]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h1>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setCursor(new Date())} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            Today
          </button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-500">
            {d}
          </div>
        ))}
        {gridDays.map((day, i) => {
          const events = day ? eventsByDay.get(day.toDateString()) ?? [] : [];
          const isToday = day && day.toDateString() === new Date().toDateString();
          return (
            <div key={i} className="min-h-[100px] bg-white p-2">
              {day && (
                <>
                  <span className={`text-xs font-medium ${isToday ? 'rounded-full bg-brand-600 px-1.5 py-0.5 text-white' : 'text-slate-500'}`}>
                    {day.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 3).map((e) => {
                      const Style = typeStyles[e.type];
                      const Icon = Style.icon;
                      return (
                        <div key={e.id} className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${Style.className}`} title={e.title}>
                          <Icon className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{e.title}</span>
                        </div>
                      );
                    })}
                    {events.length > 3 && <p className="text-[10px] text-slate-400">+{events.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
