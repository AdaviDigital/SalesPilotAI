import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Upload, Download, GitMerge } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';
import { ImportModal } from '@/components/ImportModal';
import { DuplicatesModal } from '@/components/DuplicatesModal';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  companyName: string | null;
  status: string;
  leadScore: number | null;
  temperature: string | null;
  estimatedValue: string | null;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  QUALIFIED: 'bg-emerald-100 text-emerald-700',
  UNQUALIFIED: 'bg-red-100 text-red-700',
  NURTURING: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-violet-100 text-violet-700',
  LOST: 'bg-slate-200 text-slate-500',
};

export function Leads() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', companyName: '' });

  async function exportCsv() {
    const response = await api.get('/leads/export', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leads.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => (await api.get('/leads')).data as { items: Lead[]; total: number },
  });

  const createLead = useMutation({
    mutationFn: async () => (await api.post('/leads', form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', companyName: '' });
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} total leads</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" /> Import
          </button>
          <button
            onClick={() => setShowDuplicates(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <GitMerge className="h-4 w-4" /> Duplicates
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> New Lead
          </button>
        </div>
      </div>

      {showDuplicates && <DuplicatesModal onClose={() => setShowDuplicates(false)} />}

      {showImport && (
        <ImportModal
          entity="leads"
          invalidateKey="leads"
          onClose={() => setShowImport(false)}
          fields={[
            { key: 'firstName', label: 'First Name', required: true },
            { key: 'lastName', label: 'Last Name', required: true },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'companyName', label: 'Company' },
            { key: 'jobTitle', label: 'Job Title' },
            { key: 'industry', label: 'Industry' },
            { key: 'source', label: 'Source' },
            { key: 'estimatedValue', label: 'Est. Value' },
          ]}
        />
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLead.mutate();
          }}
          className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-5"
        >
          <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Company" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={createLead.isPending} className="flex-1 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {createLead.isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-slate-300 px-2 py-2 text-slate-500 hover:bg-slate-50">
              <X className="h-4 w-4" />
            </button>
          </div>
          {createLead.isError && (
            <p className="col-span-full text-sm text-red-600">
              {getApiErrorMessage(createLead.error, 'Could not create lead')}
            </p>
          )}
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Temperature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading leads…</td></tr>
            )}
            {isError && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-red-500">Could not load leads. Is the API running?</td></tr>
            )}
            {data?.items.length === 0 && !isLoading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No leads yet — add your first one above.</td></tr>
            )}
            {data?.items.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  <Link to={`/leads/${lead.id}`} className="hover:text-brand-700 hover:underline">{lead.firstName} {lead.lastName}</Link>
                  {lead.email && <div className="text-xs font-normal text-slate-400">{lead.email}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.companyName ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.leadScore != null ? `${lead.leadScore}/100` : '—'}</td>
                <td className="px-4 py-3 text-slate-600">{lead.temperature ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
