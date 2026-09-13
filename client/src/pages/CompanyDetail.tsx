import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { NotesSection } from '@/components/NotesSection';
import { CustomFieldsSection } from '@/components/CustomFieldsSection';

interface CompanyDetail {
  id: string;
  name: string;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  location: string | null;
  aiSummary: string | null;
  aiSummaryUpdatedAt: string | null;
  contacts: { id: string; firstName: string; lastName: string }[];
  deals: { id: string; name: string; value: string; status: string }[];
}

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => (await api.get(`/companies/${id}`)).data as CompanyDetail,
    enabled: !!id,
  });

  const summarize = useMutation({
    mutationFn: async () => (await api.post('/ai/summarize', { entity: 'company', id })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', id] }),
  });

  if (isLoading || !company) return <div className="p-8 text-sm text-slate-400">Loading…</div>;

  return (
    <div className="p-8">
      <Link to="/companies" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Companies
      </Link>

      <h1 className="mb-6 text-xl font-bold text-slate-900">{company.name}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <p className="text-sm font-semibold text-slate-800">AI Customer Summary</p>
              </div>
              <button
                onClick={() => summarize.mutate()}
                disabled={summarize.isPending}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {summarize.isPending ? 'Summarizing…' : company.aiSummary ? 'Refresh' : 'Summarize'}
              </button>
            </div>
            <p className="text-sm text-slate-600">{company.aiSummary ?? 'No summary yet — click Summarize to generate one.'}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ActivityTimeline relatedKey="companyId" relatedId={company.id} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <NotesSection relatedKey="companyId" relatedId={company.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Details</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Industry</dt><dd className="text-slate-700">{company.industry ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Size</dt><dd className="text-slate-700">{company.companySize ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Location</dt><dd className="text-slate-700">{company.location ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Contacts ({company.contacts.length})</p>
            {company.contacts.length === 0 && <p className="text-xs text-slate-400">No contacts yet.</p>}
            <div className="space-y-1.5">
              {company.contacts.map((c) => (
                <Link key={c.id} to={`/contacts/${c.id}`} className="block text-xs text-brand-700 hover:underline">
                  {c.firstName} {c.lastName}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Deals ({company.deals.length})</p>
            {company.deals.length === 0 && <p className="text-xs text-slate-400">No deals yet.</p>}
            <div className="space-y-1.5">
              {company.deals.map((d) => (
                <Link key={d.id} to={`/deals/${d.id}`} className="flex justify-between text-xs text-brand-700 hover:underline">
                  <span>{d.name}</span>
                  <span className="text-slate-400">${Number(d.value).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>

          <CustomFieldsSection relatedKey="companyId" relatedId={company.id} />
        </div>
      </div>
    </div>
  );
}
