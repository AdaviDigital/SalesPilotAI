import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip, X, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';

interface FileRecord {
  id: string;
  fileName: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export function FileAttachments({ relatedType, relatedId }: { relatedType: 'lead' | 'contact' | 'company' | 'deal'; relatedId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: files } = useQuery({
    queryKey: ['files', relatedType, relatedId],
    queryFn: async () => (await api.get('/files', { params: { relatedType, relatedId } })).data as FileRecord[],
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('relatedType', relatedType);
      formData.append('relatedId', relatedId);
      return (await api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files', relatedType, relatedId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/files/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files', relatedType, relatedId] }),
  });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-500">Attachments</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          <Paperclip className="h-3.5 w-3.5" /> {upload.isPending ? 'Uploading…' : 'Attach file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = '';
          }}
        />
      </div>
      {upload.isError && <p className="mb-2 text-xs text-red-600">{getApiErrorMessage(upload.error, 'Upload failed')}</p>}
      <div className="space-y-1.5">
        {files?.length === 0 && <p className="text-xs text-slate-400">No files attached yet.</p>}
        {files?.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
            <a href={f.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1.5 text-xs text-slate-700 hover:text-brand-700">
              <FileText className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">{f.fileName}</span>
              <span className="flex-shrink-0 text-slate-400">({Math.round(f.sizeBytes / 1024)}KB)</span>
            </a>
            <button onClick={() => remove.mutate(f.id)} className="text-slate-400 hover:text-red-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
