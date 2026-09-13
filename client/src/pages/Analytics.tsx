import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';

interface TeamPerformance {
  userId: string;
  name: string;
  calls: number;
  emails: number;
  meetings: number;
  dealsWon: number;
  revenue: number;
  conversionRate: number;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function Analytics() {
  const { data: sales } = useQuery({
    queryKey: ['analytics', 'sales'],
    queryFn: async () => (await api.get('/analytics/sales')).data,
  });
  const { data: leads } = useQuery({
    queryKey: ['analytics', 'leads'],
    queryFn: async () => (await api.get('/analytics/leads')).data,
  });
  const { data: team } = useQuery({
    queryKey: ['analytics', 'team'],
    queryFn: async () => (await api.get('/analytics/team')).data as TeamPerformance[],
  });
  const { data: funnel } = useQuery({
    queryKey: ['analytics', 'funnel'],
    queryFn: async () => (await api.get('/analytics/funnel')).data as { stage: string; dealCount: number; totalValue: number }[],
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Analytics</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={`$${(sales?.totalRevenue ?? 0).toLocaleString()}`} />
        <StatCard label="Win Rate" value={`${sales?.winRate ?? 0}%`} />
        <StatCard label="Avg Deal Size" value={`$${(sales?.averageDealSize ?? 0).toLocaleString()}`} />
        <StatCard label="Lead Conversion" value={`${leads?.conversionRate ?? 0}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Pipeline Funnel</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Bar dataKey="dealCount" fill="#4c46f5" name="Deals" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Lead Sources</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={leads?.bySource ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="source" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="leadCount" fill="#6d7bff" name="Leads" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Team Performance</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Rep</th>
              <th className="py-2">Calls</th>
              <th className="py-2">Emails</th>
              <th className="py-2">Meetings</th>
              <th className="py-2">Deals Won</th>
              <th className="py-2">Revenue</th>
              <th className="py-2">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team?.map((r) => (
              <tr key={r.userId}>
                <td className="py-2 font-medium text-slate-800">{r.name}</td>
                <td className="py-2 text-slate-600">{r.calls}</td>
                <td className="py-2 text-slate-600">{r.emails}</td>
                <td className="py-2 text-slate-600">{r.meetings}</td>
                <td className="py-2 text-slate-600">{r.dealsWon}</td>
                <td className="py-2 text-slate-600">${r.revenue.toLocaleString()}</td>
                <td className="py-2 text-slate-600">{r.conversionRate}%</td>
              </tr>
            ))}
            {team?.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-slate-400">No team activity recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
