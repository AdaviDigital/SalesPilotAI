import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Zap, X } from 'lucide-react';
import { api } from '@/lib/api';

interface Automation {
  id: string;
  name: string;
  isActive: boolean;
  triggers: { entityType: string; eventType: string; config: Record<string, unknown> }[];
  actions: { actionType: string; config: Record<string, unknown> }[];
}

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'NURTURING', 'CONVERTED', 'LOST'];

export function Automation() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', toStatus: 'QUALIFIED', taskTitle: 'Follow up with lead', dueInDays: 1 });

  const { data: automations, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => (await api.get('/automation')).data as Automation[],
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post('/automation', {
        name: form.name,
        isActive: true,
        triggers: [{ entityType: 'lead', eventType: 'status_changed', config: { toStatus: form.toStatus } }],
        actions: [{ actionType: 'create_task', config: { title: form.taskTitle, dueInDays: form.dueInDays }, order: 0 }],
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      setShowForm(false);
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => (await api.patch(`/automation/${id}`, { isActive })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  });

  const runSweep = useMutation({
    mutationFn: async () => (await api.post('/automation/run-inactivity-check')).data as { dealsFlagged: number },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Automation</h1>
          <p className="text-sm text-slate-500">{automations?.length ?? 0} workflows configured</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runSweep.mutate()}
            disabled={runSweep.isPending}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            title="Manually run the deal-inactivity check (normally scheduled via cron)"
          >
            {runSweep.isPending ? 'Running…' : 'Run inactivity check'}
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New Automation
          </button>
        </div>
      </div>

      {runSweep.isSuccess && (
        <p className="mb-4 rounded-md bg-brand-50 p-3 text-sm text-brand-700">
          Sweep complete — {runSweep.data.dealsFlagged} deal(s) flagged as inactive.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <p className="text-xs font-semibold uppercase text-slate-500">When a lead&apos;s status changes to…</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required placeholder="Automation name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <select value={form.toStatus} onChange={(e) => setForm({ ...form, toStatus: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <p className="text-xs font-semibold uppercase text-slate-500">…then create this task</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="Task title" value={form.taskTitle} onChange={(e) => setForm({ ...form, taskTitle: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" min={0} placeholder="Due in days" value={form.dueInDays} onChange={(e) => setForm({ ...form, dueInDays: Number(e.target.value) })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {create.isPending ? 'Saving…' : 'Save Automation'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-slate-300 px-3 py-2 text-slate-500 hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {automations?.length === 0 && !isLoading && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            No automations yet — create one above.
          </p>
        )}
        {automations?.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Zap className={`h-4 w-4 ${a.isActive ? 'text-brand-600' : 'text-slate-300'}`} />
              <div>
                <p className="text-sm font-medium text-slate-800">{a.name}</p>
                <p className="text-xs text-slate-400">
                  {a.triggers.map((t) => `${t.entityType} ${t.eventType}`).join(', ')} → {a.actions.map((ac) => ac.actionType).join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggle.mutate({ id: a.id, isActive: !a.isActive })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {a.isActive ? 'Active' : 'Paused'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
