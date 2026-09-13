import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Upload, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { ImportModal } from '@/components/ImportModal';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  jobTitle: string | null;
  company: { id: string; name: string } | null;
}

export function Contacts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', jobTitle: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => (await api.get('/contacts')).data as { items: Contact[]; total: number },
  });

  const createContact = useMutation({
    mutationFn: async () => (await api.post('/contacts', form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', jobTitle: '' });
    },
  });

  async function exportCsv() {
    const response = await api.get('/contacts/export', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} total contacts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Upload className="h-4 w-4" /> Import
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New Contact
          </button>
        </div>
      </div>

      {showImport && (
        <ImportModal
          entity="contacts"
          invalidateKey="contacts"
          onClose={() => setShowImport(false)}
          fields={[
            { key: 'firstName', label: 'First Name', required: true },
            { key: 'lastName', label: 'Last Name', required: true },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'jobTitle', label: 'Job Title' },
            { key: 'companyName', label: 'Company (existing name)' },
          ]}
        />
      )}

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); createContact.mutate(); }}
          className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-5"
        >
          <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" disabled={createContact.isPending} className="flex-1 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {createContact.isPending ? 'Saving…' : 'Save'}
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
              <th className="px-4 py-3">Job Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {data?.items.length === 0 && !isLoading && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No contacts yet.</td></tr>
            )}
            {data?.items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  <Link to={`/contacts/${c.id}`} className="hover:text-brand-700 hover:underline">{c.firstName} {c.lastName}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.jobTitle ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.company?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
