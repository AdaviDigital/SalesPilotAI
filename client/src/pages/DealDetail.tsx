import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { NotesSection } from '@/components/NotesSection';
import { FileAttachments } from '@/components/FileAttachments';
import { CustomFieldsSection } from '@/components/CustomFieldsSection';

interface DealDetail {
  id: string;
  name: string;
  value: string;
  currency: string;
  probability: number;
  status: string;
  expectedCloseDate: string | null;
  company: { id: string; name: string } | null;
  primaryContact: { firstName: string; lastName: string } | null;
  stage: { name: string };
  aiHealth: string | null;
  aiRiskLevel: string | null;
  aiCloseProbability: number | null;
  aiRecommendedAction: string | null;
  aiExplanation: string | null;
}

const HEALTH_STYLE: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  healthy: { icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700', label: 'Healthy' },
  needs_attention: { icon: AlertCircle, className: 'bg-amber-100 text-amber-700', label: 'Needs Attention' },
  at_risk: { icon: AlertTriangle, className: 'bg-red-100 text-red-700', label: 'At Risk' },
};

export function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: async () => (await api.get(`/deals/${id}`)).data as DealDetail,
    enabled: !!id,
  });

  const analyze = useMutation({
    mutationFn: async () => (await api.post(`/ai/deals/${id}/analyze`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deal', id] }),
  });

  if (isLoading || !deal) return <div className="p-8 text-sm text-slate-400">Loading…</div>;

  const health = deal.aiHealth ? HEALTH_STYLE[deal.aiHealth] : null;

  return (
    <div className="p-8">
      <Link to="/deals" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Deals
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{deal.name}</h1>
        <p className="text-sm text-slate-500">
          {deal.company?.name ?? 'No company'} · {deal.currency} {Number(deal.value).toLocaleString()} · {deal.stage.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <p className="text-sm font-semibold text-slate-800">AI Deal Intelligence</p>
              </div>
              <button
                onClick={() => analyze.mutate()}
                disabled={analyze.isPending}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {analyze.isPending ? 'Analyzing…' : 'Analyze Deal'}
              </button>
            </div>
            {deal.aiHealth ? (
              <>
                <div className="flex items-center gap-3">
                  {health && (
                    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${health.className}`}>
                      <health.icon className="h-4 w-4" /> {health.label}
                    </span>
                  )}
                  {deal.aiCloseProbability != null && (
                    <span className="text-sm text-slate-500">{Math.round(deal.aiCloseProbability * 100)}% close probability</span>
                  )}
                </div>
                {deal.aiExplanation && <p className="mt-3 text-sm text-slate-600">{deal.aiExplanation}</p>}
                {deal.aiRecommendedAction && (
                  <p className="mt-2 rounded-md bg-slate-50 p-2.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Recommended: </span>{deal.aiRecommendedAction}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Not yet analyzed — click &quot;Analyze Deal&quot; for a risk assessment.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <ActivityTimeline relatedKey="dealId" relatedId={deal.id} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <NotesSection relatedKey="dealId" relatedId={deal.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Details</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Stage</dt><dd className="text-slate-700">{deal.stage.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Probability</dt><dd className="text-slate-700">{deal.probability}%</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Status</dt><dd className="text-slate-700">{deal.status}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Contact</dt><dd className="text-slate-700">{deal.primaryContact ? `${deal.primaryContact.firstName} ${deal.primaryContact.lastName}` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">Expected close</dt><dd className="text-slate-700">{deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <FileAttachments relatedType="deal" relatedId={deal.id} />
          </div>

          <CustomFieldsSection relatedKey="dealId" relatedId={deal.id} />
        </div>
      </div>
    </div>
  );
}
