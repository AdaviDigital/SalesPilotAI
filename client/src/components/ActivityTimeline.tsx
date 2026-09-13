import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, Users, StickyNote, Clock, Plus } from 'lucide-react';
import { api } from '@/lib/api';

type RelatedKey = 'leadId' | 'contactId' | 'companyId' | 'dealId';

interface Activity {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'FOLLOW_UP' | 'TASK';
  subject: string;
  body: string | null;
  occurredAt: string;
  user: { firstName: string; lastName: string } | null;
}

const TYPE_ICONS: Record<string, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  NOTE: StickyNote,
  FOLLOW_UP: Clock,
  TASK: Clock,
};

export function ActivityTimeline({ relatedKey, relatedId }: { relatedKey: RelatedKey; relatedId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'CALL', subject: '', body: '' });

  const { data } = useQuery({
    queryKey: ['activities', relatedKey, relatedId],
    queryFn: async () => (await api.get('/activities', { params: { [relatedKey]: relatedId } })).data as { items: Activity[] },
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/activities', { ...form, [relatedKey]: relatedId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', relatedKey, relatedId] });
      setShowForm(false);
      setForm({ type: 'CALL', subject: '', body: '' });
    },
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-500">Activity</p>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
          <Plus className="h-3.5 w-3.5" /> Log activity
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="mb-4 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <div className="flex gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="NOTE">Note</option>
            </select>
            <input
              required
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            />
          </div>
          <textarea
            placeholder="Notes / transcript (optional — enables AI conversation analysis)"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
              {create.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:bg-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {data?.items.length === 0 && <p className="text-xs text-slate-400">No activity logged yet.</p>}
        {data?.items.map((a) => {
          const Icon = TYPE_ICONS[a.type] ?? Clock;
          return (
            <div key={a.id} className="flex gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Icon className="h-3 w-3 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-800">{a.subject}</p>
                {a.body && <p className="mt-0.5 text-xs text-slate-500">{a.body}</p>}
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {new Date(a.occurredAt).toLocaleString()} {a.user ? `· ${a.user.firstName} ${a.user.lastName}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
