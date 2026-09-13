import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';

interface Stage {
  id: string;
  name: string;
  order: number;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Company {
  id: string;
  name: string;
}

export function DealFormModal({ defaultStageId, onClose }: { defaultStageId?: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => (await api.get('/pipelines')).data as Pipeline[],
  });
  const { data: companies } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: async () => (await api.get('/companies', { params: { pageSize: 100 } })).data.items as Company[],
  });

  const pipeline = pipelines?.[0];

  const [form, setForm] = useState({
    name: '',
    companyId: '',
    value: '',
    currency: 'USD',
    stageId: defaultStageId ?? '',
    expectedCloseDate: '',
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post('/deals', {
        name: form.name,
        companyId: form.companyId || undefined,
        value: form.value ? Number(form.value) : 0,
        currency: form.currency,
        pipelineId: pipeline!.id,
        stageId: form.stageId || pipeline!.stages[0].id,
        expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate).toISOString() : undefined,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">New Deal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="space-y-3"
        >
          <input
            required
            placeholder="Deal name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">No company</option>
            {companies?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              placeholder="Deal value"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {['USD', 'NGN', 'GBP', 'EUR', 'CAD', 'AUD'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Pipeline stage</label>
            <select
              required
              value={form.stageId}
              onChange={(e) => setForm({ ...form, stageId: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select a stage…</option>
              {pipeline?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Expected close date</label>
            <input
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {create.isError && (
            <p className="text-sm text-red-600">{getApiErrorMessage(create.error, 'Could not create deal')}</p>
          )}
          <button
            type="submit"
            disabled={create.isPending || !pipeline}
            className="w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {create.isPending ? 'Creating…' : 'Create Deal'}
          </button>
        </form>
      </div>
    </div>
  );
}
