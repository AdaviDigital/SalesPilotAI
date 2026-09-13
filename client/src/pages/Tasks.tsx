import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Check } from 'lucide-react';
import { api } from '@/lib/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  deal: {
    id: string;
    name: string;
  } | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

type TaskPriority = Task['priority'];

interface TaskForm {
  title: string;
  dueDate: string;
  priority: TaskPriority;
}

const views = [
  { key: 'mine', label: 'My Tasks' },
  { key: 'team', label: 'Team Tasks' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
] as const;

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

const initialForm: TaskForm = {
  title: '',
  dueDate: '',
  priority: 'MEDIUM',
};

export function Tasks() {
  const queryClient = useQueryClient();

  const [view, setView] = useState<(typeof views)[number]['key']>('mine');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TaskForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', view],
    queryFn: async () =>
      (
        await api.get('/tasks', {
          params: { view },
        })
      ).data as {
        items: Task[];
        total: number;
      },
  });

  const createTask = useMutation({
    mutationFn: async () =>
      (
        await api.post('/tasks', {
          title: form.title,
          priority: form.priority,
          dueDate: form.dueDate
            ? new Date(form.dueDate).toISOString()
            : undefined,
        })
      ).data,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });

      setShowForm(false);
      setForm(initialForm);
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Task['status'];
    }) =>
      (
        await api.patch(`/tasks/${id}`, {
          status,
        })
      ).data,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>

          <p className="text-sm text-slate-500">
            {data?.total ?? 0} tasks in this view
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      <div className="mb-4 flex w-fit gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === v.key
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createTask.mutate();
          }}
          className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4"
        >
          <input
            required
            placeholder="Task title"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />

          <input
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm({
                ...form,
                dueDate: event.target.value,
              })
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <select
            value={form.priority}
            onChange={(event) =>
              setForm({
                ...form,
                priority: event.target.value as TaskPriority,
              })
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <div className="flex gap-2 sm:col-span-4">
            <button
              type="submit"
              disabled={createTask.isPending}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createTask.isPending ? 'Saving…' : 'Save Task'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(initialForm);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-500 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {isLoading && (
          <p className="text-sm text-slate-400">
            Loading tasks…
          </p>
        )}

        {data?.items.length === 0 && !isLoading && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No tasks in this view.
          </p>
        )}

        {data?.items.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            <button
              onClick={() =>
                toggleComplete.mutate({
                  id: task.id,
                  status:
                    task.status === 'COMPLETED'
                      ? 'OPEN'
                      : 'COMPLETED',
                })
              }
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                task.status === 'COMPLETED'
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300'
              }`}
            >
              {task.status === 'COMPLETED' && (
                <Check className="h-3 w-3" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  task.status === 'COMPLETED'
                    ? 'text-slate-400 line-through'
                    : 'text-slate-800'
                }`}
              >
                {task.title}
              </p>

              <p className="text-xs text-slate-400">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : 'No due date'}

                {task.deal ? ` · ${task.deal.name}` : ''}

                {task.lead
                  ? ` · ${task.lead.firstName} ${task.lead.lastName}`
                  : ''}
              </p>
            </div>

            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                priorityColors[task.priority]
              }`}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}