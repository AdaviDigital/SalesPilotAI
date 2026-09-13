import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

type RelatedKey = 'leadId' | 'contactId' | 'companyId' | 'dealId';

interface Note {
  id: string;
  body: string;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
}

export function NotesSection({ relatedKey, relatedId }: { relatedKey: RelatedKey; relatedId: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data } = useQuery({
    queryKey: ['notes', relatedKey, relatedId],
    queryFn: async () => (await api.get('/notes', { params: { [relatedKey]: relatedId } })).data as Note[],
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/notes', { body: text, [relatedKey]: relatedId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', relatedKey, relatedId] });
      setText('');
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', relatedKey, relatedId] }),
  });

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Notes</p>
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) create.mutate(); }}
        className="mb-3 flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note…"
          className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
        />
        <button type="submit" disabled={create.isPending || !text.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          Add
        </button>
      </form>
      <div className="space-y-2">
        {data?.length === 0 && <p className="text-xs text-slate-400">No notes yet.</p>}
        {data?.map((n) => (
          <div key={n.id} className="flex items-start justify-between rounded-md border border-slate-200 bg-white p-2.5">
            <div>
              <p className="text-xs text-slate-700">{n.body}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {new Date(n.createdAt).toLocaleString()} {n.user ? `· ${n.user.firstName} ${n.user.lastName}` : ''}
              </p>
            </div>
            <button onClick={() => remove.mutate(n.id)} className="text-slate-300 hover:text-red-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
