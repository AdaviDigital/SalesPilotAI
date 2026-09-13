import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

const METRICS = ['revenue', 'deal_count', 'lead_count', 'conversion_rate', 'activity_count'];
const DIMENSIONS = ['owner', 'source', 'industry', 'stage', 'month'];
const RANGES = ['last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'this_quarter', 'this_year', 'all_time'];

interface SavedReport {
  id: string;
  name: string;
  config: { metric: string; dimension: string; dateRange: string };
}

export function Reports() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({ metric: 'revenue', dimension: 'owner', dateRange: 'last_30_days' });
  const [reportName, setReportName] = useState('');

  const { data: saved } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await api.get('/reports')).data as SavedReport[],
  });

  const preview = useMutation({
    mutationFn: async () => (await api.post('/reports/preview', config)).data as { label: string; value: number }[],
  });

  const save = useMutation({
    mutationFn: async () => (await api.post('/reports', { name: reportName, config })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setReportName('');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Report Builder</h1>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-1">
          <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Configuration</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Metric</label>
              <select value={config.metric} onChange={(e) => setConfig({ ...config, metric: e.target.value })} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm">
                {METRICS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Group by</label>
              <select value={config.dimension} onChange={(e) => setConfig({ ...config, dimension: e.target.value })} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm">
                {DIMENSIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Date range</label>
              <select value={config.dateRange} onChange={(e) => setConfig({ ...config, dateRange: e.target.value })} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm">
                {RANGES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <button onClick={() => preview.mutate()} disabled={preview.isPending} className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {preview.isPending ? 'Running…' : 'Run report'}
            </button>

            {preview.isSuccess && (
              <div className="flex gap-2 pt-2">
                <input placeholder="Save as…" value={reportName} onChange={(e) => setReportName(e.target.value)} className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
                <button onClick={() => save.mutate()} disabled={!reportName || save.isPending} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
            {config.metric.replace(/_/g, ' ')} by {config.dimension}
          </p>
          {preview.data ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={preview.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4c46f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">Configure a report and click &quot;Run report&quot; to see results.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Saved Reports</p>
        {saved?.length === 0 && <p className="text-sm text-slate-400">No saved reports yet.</p>}
        <div className="space-y-2">
          {saved?.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-400">{r.config.metric} by {r.config.dimension} · {r.config.dateRange.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={() => remove.mutate(r.id)} className="text-slate-300 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
