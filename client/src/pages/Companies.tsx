import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Upload, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { ImportModal } from '@/components/ImportModal';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  _count: { contacts: number; deals: number };
}

export function Companies() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ name: '', industry: '', website: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => (await api.get('/companies')).data as { items: Company[]; total: number },
  });

  const createCompany = useMutation({
    mutationFn: async () => (await api.post('/companies', form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowForm(false);
      setForm({ name: '', industry: '', website: '' });
    },
  });

  async function exportCsv() {
    const response = await api.get('/companies/export', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'companies.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} total companies</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Import
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New Company
          </button>
        </div>
      </div>

      {showImport && (
        <ImportModal
          entity="companies"
          invalidateKey="companies"
          onClose={() => setShowImport(false)}
          fields={[
            { key: 'name', label: 'Company Name', required: true },
            { key: 'website', label: 'Website' },
            { key: 'industry', label: 'Industry' },
            { key: 'companySize', label: 'Company Size' },
            { key: 'location', label: 'Location' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
          ]}
        />
      )}

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); createCompany.mutate(); }}
          className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4"
        >
          <input required placeholder="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={createCompany.isPending} className="flex-1 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {createCompany.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-slate-300 px-2 py-2 text-slate-500 hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Contacts</th>
              <th className="px-4 py-3">Deals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {data?.items.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No companies yet.</td></tr>
            )}
            {data?.items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  <Link to={`/companies/${c.id}`} className="hover:text-brand-700 hover:underline">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.industry ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.location ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c._count.contacts}</td>
                <td className="px-4 py-3 text-slate-600">{c._count.deals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
