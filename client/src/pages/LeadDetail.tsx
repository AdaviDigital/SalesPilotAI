import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Mail, Flame, Snowflake, Thermometer } from 'lucide-react';
import { api } from '@/lib/api';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { NotesSection } from '@/components/NotesSection';
import { FileAttachments } from '@/components/FileAttachments';
import { CustomFieldsSection } from '@/components/CustomFieldsSection';

interface LeadDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  jobTitle: string | null;
  status: string;
  source: string | null;
  estimatedValue: string | null;
  leadScore: number | null;
  temperature: 'HOT' | 'WARM' | 'COLD' | null;
  buyingIntent: string | null;
  recommendedAction: string | null;
  aiScoreExplanation: string | null;
  aiScoredAt: string | null;
  tasks: { id: string; title: string; status: string; dueDate: string | null }[];
}

const TEMP_STYLE = {
  HOT: { icon: Flame, className: 'bg-red-100 text-red-700' },
  WARM: { icon: Thermometer, className: 'bg-amber-100 text-amber-700' },
  COLD: { icon: Snowflake, className: 'bg-blue-100 text-blue-700' },
};

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showEmail, setShowEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [tone, setTone] = useState('Professional');

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => (await api.get(`/leads/${id}`)).data as LeadDetail,
    enabled: !!id,
  });

  const score = useMutation({
    mutationFn: async () => (await api.post(`/ai/leads/${id}/score`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead', id] }),
  });

  const generateEmail = useMutation({
    mutationFn: async () =>
      (await api.post('/ai/email', {
        intent: 'cold_email',
        tone,
        context: `Outreach to ${lead?.firstName} ${lead?.lastName}, ${lead?.jobTitle ?? ''} at ${lead?.companyName ?? 'their company'}. Lead status: ${lead?.status}.`,
      })).data as { subject: string; body: string },
    onSuccess: (data) => setEmailDraft(data),
  });

  if (isLoading || !lead) return <div className="p-8 text-sm text-slate-400">Loading…</div>;

  const temp = lead.temperature ? TEMP_STYLE[lead.temperature] : null;

  return (
    <div className="p-8">
      <Link to="/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{lead.firstName} {lead.lastName}</h1>
          <p className="text-sm text-slate-500">
            {lead.jobTitle ? `${lead.jobTitle} · ` : ''}{lead.companyName ?? 'No company'}
          </p>
        </div>
        <button
          onClick={() => setShowEmail(true)}
          className="flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          <Mail className="h-4 w-4" /> Draft AI Email
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* AI Score card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <p className="text-sm font-semibold text-slate-800">AI Lead Score</p>
              </div>
              <button
                onClick={() => score.mutate()}
                disabled={score.isPending}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {score.isPending ? 'Scoring…' : 'Score Lead'}
              </button>
            </div>
            {lead.leadScore != null ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold text-slate-900">{lead.leadScore}<span className="text-base font-medium text-slate-400">/100</span></span>
                  {temp && (
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${temp.className}`}>
                      <temp.icon className="h-3.5 w-3.5" /> {lead.temperature}
                    </span>
                  )}
                </div>
                {lead.aiScoreExplanation && <p className="mt-3 text-sm text-slate-600">{lead.aiScoreExplanation}</p>}
                {lead.recommendedAction && (
                  <p className="mt-2 rounded-md bg-slate-50 p-2.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Recommended: </span>{lead.recommendedAction}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Not yet scored — click &quot;Score Lead&quot; to generate an AI priority score.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ActivityTimeline relatedKey="leadId" relatedId={lead.id} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <NotesSection relatedKey="leadId" relatedId={lead.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Details</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Email</dt><dd className="text-slate-700">{lead.email ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Phone</dt><dd className="text-slate-700">{lead.phone ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Status</dt><dd className="text-slate-700">{lead.status}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Source</dt><dd className="text-slate-700">{lead.source ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Est. value</dt><dd className="text-slate-700">{lead.estimatedValue ? `$${Number(lead.estimatedValue).toLocaleString()}` : '—'}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Tasks</p>
            {lead.tasks.length === 0 && <p className="text-xs text-slate-400">No tasks linked.</p>}
            <div className="space-y-1.5">
              {lead.tasks.map((t) => (
                <div key={t.id} className="text-xs text-slate-600">
                  {t.title} {t.dueDate && <span className="text-slate-400">· {new Date(t.dueDate).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <FileAttachments relatedType="lead" relatedId={lead.id} />
          </div>

          <CustomFieldsSection relatedKey="leadId" relatedId={lead.id} />
        </div>
      </div>

      {showEmail && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">AI Email Draft</h2>
              <button onClick={() => { setShowEmail(false); setEmailDraft(null); }} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                {['Professional', 'Friendly', 'Persuasive', 'Concise', 'Consultative', 'Executive', 'Urgent'].map((t) => <option key={t}>{t}</option>)}
              </select>
              <button onClick={() => generateEmail.mutate()} disabled={generateEmail.isPending} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
                {generateEmail.isPending ? 'Generating…' : emailDraft ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {emailDraft ? (
              <div className="space-y-2">
                <input readOnly value={emailDraft.subject} className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium" />
                <textarea readOnly value={emailDraft.body} rows={8} className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs" />
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click Generate to draft an email with AI.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
