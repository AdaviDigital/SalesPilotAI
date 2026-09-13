import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Handshake, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLead {
  status: string;
  temperature: string;
}

interface DashboardLeadResponse {
  items: DashboardLead[];
  total: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['leads', 'dashboard'],
    queryFn: async () => (await api.get('/leads', { params: { pageSize: 100 } })).data as DashboardLeadResponse,
  });

  const total = data?.total ?? 0;
  const qualified = data?.items.filter((l) => l.status === 'QUALIFIED').length ?? 0;
  const hot = data?.items.filter((l) => l.temperature === 'HOT').length ?? 0;

  const cards = [
    { label: 'Total Leads', value: total, icon: Users },
    { label: 'Qualified Leads', value: qualified, icon: TrendingUp },
    { label: 'Hot Leads', value: hot, icon: Handshake },
    { label: 'Open Deals', value: 0, icon: DollarSign },
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-slate-900">Welcome back{user ? `, ${user.email.split('@')[0]}` : ''}</h1>
      <p className="mb-6 text-sm text-slate-500">Here&apos;s what&apos;s happening with your sales today.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-brand-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Pipeline charts, AI insights, and team performance widgets land here in Phase 8 (Analytics) and Phase 9-10
        (AI infrastructure) — wired to real deal/activity data the same way this dashboard&apos;s lead counts are.
      </div>
    </div>
  );
}
