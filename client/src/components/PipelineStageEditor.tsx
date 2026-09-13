import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';

interface Stage {
  id: string;
  name: string;
  order: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

export function PipelineStageEditor({ pipelineId, onClose }: { pipelineId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [newStageName, setNewStageName] = useState('');
  const [newStageProbability, setNewStageProbability] = useState(50);
  const [error, setError] = useState<string | null>(null);

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => (await api.get('/pipelines')).data as { id: string; stages: Stage[] }[],
  });

  const stages = pipelines?.find((p) => p.id === pipelineId)?.stages ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['pipelines'] });
  }

  const addStage = useMutation({
    mutationFn: async () => (await api.post(`/pipelines/${pipelineId}/stages`, { name: newStageName, probability: newStageProbability })).data,
    onSuccess: () => {
      setNewStageName('');
      invalidate();
    },
  });

  const renameStage = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => (await api.patch(`/pipelines/stages/${id}`, { name })).data,
    onSuccess: invalidate,
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => api.delete(`/pipelines/stages/${id}`),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Could not delete stage')),
  });

  const reorder = useMutation({
    mutationFn: async (stageIds: string[]) => (await api.patch(`/pipelines/${pipelineId}/stages/reorder`, { stageIds })).data,
    onSuccess: invalidate,
  });

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;
    const ids = stages.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Manage Pipeline Stages</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        {error && <p className="mb-3 rounded-md bg-red-50 p-2.5 text-xs text-red-600">{error}</p>}

        <div className="space-y-1.5">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === stages.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
              <input
                defaultValue={stage.name}
                onBlur={(e) => e.target.value !== stage.name && e.target.value.trim() && renameStage.mutate({ id: stage.id, name: e.target.value })}
                className="flex-1 rounded border-0 bg-transparent px-1 py-1 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              {(stage.isWon || stage.isLost) && (
                <span className="text-[10px] font-medium uppercase text-slate-400">{stage.isWon ? 'Won' : 'Lost'}</span>
              )}
              <button onClick={() => deleteStage.mutate(stage.id)} className="text-slate-300 hover:text-red-600" title="Delete stage">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (newStageName.trim()) addStage.mutate(); }}
          className="mt-4 flex gap-2 border-t border-slate-100 pt-4"
        >
          <input
            placeholder="New stage name"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={newStageProbability}
            onChange={(e) => setNewStageProbability(Number(e.target.value))}
            className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            title="Default win probability at this stage"
          />
          <button type="submit" disabled={addStage.isPending} className="flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
