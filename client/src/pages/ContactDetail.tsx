import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { NotesSection } from '@/components/NotesSection';
import { CustomFieldsSection } from '@/components/CustomFieldsSection';

interface ContactDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: { id: string; name: string } | null;
  aiSummary: string | null;
  deals: { id: string; name: string; value: string }[];
}

export function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => (await api.get(`/contacts/${id}`)).data as ContactDetail,
    enabled: !!id,
  });

  const summarize = useMutation({
    mutationFn: async () => (await api.post('/ai/summarize', { entity: 'contact', id })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact', id] }),
  });

  if (isLoading || !contact) return <div className="p-8 text-sm text-slate-400">Loading…</div>;

  return (
    <div className="p-8">
      <Link to="/contacts" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Contacts
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{contact.firstName} {contact.lastName}</h1>
        <p className="text-sm text-slate-500">
          {contact.jobTitle ? `${contact.jobTitle} · ` : ''}
          {contact.company ? <Link to={`/companies/${contact.company.id}`} className="hover:underline">{contact.company.name}</Link> : 'No company'}
        </p>
      </div>

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
                {summarize.isPending ? 'Summarizing…' : contact.aiSummary ? 'Refresh' : 'Summarize'}
              </button>
            </div>
            <p className="text-sm text-slate-600">{contact.aiSummary ?? 'No summary yet — click Summarize to generate one.'}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ActivityTimeline relatedKey="contactId" relatedId={contact.id} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <NotesSection relatedKey="contactId" relatedId={contact.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Details</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Email</dt><dd className="text-slate-700">{contact.email ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Phone</dt><dd className="text-slate-700">{contact.phone ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Deals ({contact.deals.length})</p>
            {contact.deals.length === 0 && <p className="text-xs text-slate-400">No deals yet.</p>}
            <div className="space-y-1.5">
              {contact.deals.map((d) => (
                <Link key={d.id} to={`/deals/${d.id}`} className="flex justify-between text-xs text-brand-700 hover:underline">
                  <span>{d.name}</span>
                  <span className="text-slate-400">${Number(d.value).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>

          <CustomFieldsSection relatedKey="contactId" relatedId={contact.id} />
        </div>
      </div>
    </div>
  );
}
