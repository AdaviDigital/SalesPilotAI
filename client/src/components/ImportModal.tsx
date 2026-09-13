import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import { api } from '@/lib/api';

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
}

export function ImportModal({
  entity,
  fields,
  invalidateKey,
  onClose,
}: {
  entity: 'leads' | 'contacts' | 'companies';
  fields: FieldDef[];
  invalidateKey: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'map' | 'done'>('upload');
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);

  const preview = useMutation({
    mutationFn: async (f: File) => {
      const formData = new FormData();
      formData.append('file', f);
      return (await api.post(`/${entity}/import/preview`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data as {
        headers: string[];
        rowCount: number;
        sample: Record<string, string>[];
      };
    },
    onSuccess: (data) => {
      setHeaders(data.headers);
      setSample(data.sample);
      // Best-effort auto-map by matching field key to a similarly-named CSV header.
      const auto: Record<string, string> = {};
      fields.forEach((f) => {
        const match = data.headers.find((h) => h.toLowerCase().replace(/[^a-z]/g, '') === f.key.toLowerCase());
        if (match) auto[f.key] = match;
      });
      setMapping(auto);
      setStep('map');
    },
  });

  const commit = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      return (await api.post(`/${entity}/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: (data) => {
      setResult(data);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
    },
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Import {entity} from CSV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        {step === 'upload' && (
          <div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-brand-400">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="text-sm text-slate-500">Click to choose a CSV file</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    preview.mutate(f);
                  }
                }}
              />
            </label>
            {preview.isPending && <p className="mt-2 text-xs text-slate-400">Reading file…</p>}
          </div>
        )}

        {step === 'map' && (
          <div>
            <p className="mb-3 text-xs text-slate-500">Match each CRM field to a column from your CSV ({sample.length} rows previewed).</p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {fields.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <span className="w-32 flex-shrink-0 text-xs font-medium text-slate-700">
                    {f.label}{f.required && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    value={mapping[f.key] ?? ''}
                    onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                  >
                    <option value="">— Skip —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => commit.mutate()}
                disabled={commit.isPending || fields.some((f) => f.required && !mapping[f.key])}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {commit.isPending ? 'Importing…' : `Import ${sample.length > 0 ? '' : ''}rows`}
              </button>
              <button onClick={() => setStep('upload')} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div>
            <p className="text-sm text-slate-700">
              Imported <span className="font-semibold text-emerald-600">{result.imported}</span> · Skipped{' '}
              <span className="font-semibold text-amber-600">{result.skipped}</span>
            </p>
            {result.errors.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-md bg-slate-50 p-2.5">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-slate-500">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}
            <button onClick={onClose} className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
