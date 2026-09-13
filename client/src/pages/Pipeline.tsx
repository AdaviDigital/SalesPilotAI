import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DealFormModal } from '@/components/DealFormModal';
import { PipelineStageEditor } from '@/components/PipelineStageEditor';

interface Stage {
  id: string;
  name: string;
  order: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Deal {
  id: string;
  name: string;
  value: string;
  currency: string;
  stageId: string;
  probability: number;
  company: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  aiHealth: string | null;
}

export function Pipeline() {
  const queryClient = useQueryClient();
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [newDealStageId, setNewDealStageId] = useState<string | null>(null);
  const [showStageEditor, setShowStageEditor] = useState(false);

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => (await api.get('/pipelines')).data as Pipeline[],
  });

  const pipeline = pipelines?.[0];

  const { data: deals } = useQuery({
    queryKey: ['deals', pipeline?.id],
    queryFn: async () => (await api.get('/deals', { params: { pipelineId: pipeline!.id, pageSize: 200 } })).data.items as Deal[],
    enabled: !!pipeline,
  });

  const moveDeal = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      (await api.patch(`/deals/${dealId}/move`, { stageId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deals', pipeline?.id] }),
  });

  if (!pipeline) {
    return <div className="p-8 text-sm text-slate-400">Loading pipeline…</div>;
  }

  const dealsByStage = (stageId: string) => deals?.filter((d) => d.stageId === stageId) ?? [];

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{pipeline.name}</h1>
          <p className="text-sm text-slate-500">Drag deals between stages to update them.</p>
        </div>
        <button
          onClick={() => setShowStageEditor(true)}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Settings2 className="h-4 w-4" /> Manage Stages
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stage) => (
          <div
            key={stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedDeal) moveDeal.mutate({ dealId: draggedDeal, stageId: stage.id });
              setDraggedDeal(null);
            }}
            className="flex w-72 flex-shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-100/60"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
              <span className="text-sm font-semibold text-slate-700">{stage.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {dealsByStage(stage.id).length}
                </span>
                <button
                  onClick={() => setNewDealStageId(stage.id)}
                  className="rounded p-1 text-slate-400 hover:bg-white hover:text-brand-600"
                  title={`Add deal to ${stage.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {dealsByStage(stage.id).map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={() => setDraggedDeal(deal.id)}
                  className="cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <p className="text-sm font-medium text-slate-800">{deal.name}</p>
                  {deal.company && <p className="text-xs text-slate-500">{deal.company.name}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-700">
                      {deal.currency} {Number(deal.value).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">{deal.probability}%</span>
                  </div>
                </div>
              ))}
              {dealsByStage(stage.id).length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-slate-400">No deals</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {newDealStageId && <DealFormModal defaultStageId={newDealStageId} onClose={() => setNewDealStageId(null)} />}
      {showStageEditor && <PipelineStageEditor pipelineId={pipeline.id} onClose={() => setShowStageEditor(false)} />}
    </div>
  );
}
