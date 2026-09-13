import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { DealFormModal } from '@/components/DealFormModal';

interface Deal {
  id: string;
  name: string;
  value: string;
  currency: string;
  probability: number;
  status: string;
  company: { name: string } | null;
  stage: { name: string } | null;
  owner: { firstName: string; lastName: string } | null;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

export function Deals() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['deals', 'all'],
    queryFn: async () => (await api.get('/deals')).data as { items: Deal[]; total: number },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Deals</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} total deals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New Deal
        </button>
      </div>

      {showForm && <DealFormModal onClose={() => setShowForm(false)} />}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Deal</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Probability</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {data?.items.length === 0 && !isLoading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No deals yet — click &quot;New Deal&quot; to add one.</td></tr>
            )}
            {data?.items.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  <Link to={`/deals/${d.id}`} className="hover:text-brand-700 hover:underline">{d.name}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{d.company?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{d.stage?.name ?? '—'}</td>
                <td className="px-4 py-3 font-medium text-brand-700">{d.currency} {Number(d.value).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600">{d.probability}%</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[d.status] ?? 'bg-slate-100'}`}>{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
