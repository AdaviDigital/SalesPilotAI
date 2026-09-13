import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, GitMerge } from 'lucide-react';
import { api } from '@/lib/api';

interface DupLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string | null;
  status: string;
  leadScore: number | null;
  createdAt: string;
}

interface DupGroup {
  email: string;
  leads: DupLead[];
}

export function DuplicatesModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useQuery({
    queryKey: ['leads', 'duplicates'],
    queryFn: async () => (await api.get('/leads/duplicates')).data as DupGroup[],
  });

  const merge = useMutation({
    mutationFn: async ({ keepId, mergeIds }: { keepId: string; mergeIds: string[] }) =>
      (await api.post('/leads/merge', { keepId, mergeIds })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', 'duplicates'] });
    },
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <GitMerge className="h-4 w-4" /> Duplicate Leads
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        {isLoading && <p className="text-sm text-slate-400">Scanning for duplicates…</p>}
        {groups?.length === 0 && !isLoading && <p className="text-sm text-slate-400">No duplicate leads found — every email is unique.</p>}

        <div className="space-y-5">
          {groups?.map((group) => (
            <div key={group.email} className="rounded-lg border border-slate-200 p-4">
              <p className="mb-3 text-xs font-semibold text-slate-500">{group.email} — {group.leads.length} matching leads</p>
              <div className="space-y-2">
                {group.leads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-slate-400">
                        {lead.companyName ?? 'No company'} · {lead.status} · added {new Date(lead.createdAt).toLocaleDateString()}
                        {lead.leadScore != null ? ` · score ${lead.leadScore}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        merge.mutate({
                          keepId: lead.id,
                          mergeIds: group.leads.filter((l) => l.id !== lead.id).map((l) => l.id),
                        })
                      }
                      disabled={merge.isPending}
                      className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Keep this one
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
