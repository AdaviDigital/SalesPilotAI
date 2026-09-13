import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';

type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';

const TABS = ['Profile', 'Organization', 'CRM', 'AI', 'Security', 'Billing'] as const;
type Tab = (typeof TABS)[number];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function ProfileTab() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['profile'], queryFn: async () => (await api.get('/users/me')).data });
  const [form, setForm] = useState({ firstName: '', lastName: '' });

  const save = useMutation({
    mutationFn: async () => (await api.patch('/users/me', form)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  if (data && !form.firstName) setForm({ firstName: data.firstName, lastName: data.lastName });

  return (
    <div className="max-w-md space-y-4">
      <Field label="First name">
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="Last name">
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="Email">
        <input disabled value={data?.email ?? ''} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
      </Field>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        {save.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

function OrganizationTab() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['organization'], queryFn: async () => (await api.get('/organizations/current')).data });
  const [form, setForm] = useState({ name: '', industry: '', currency: 'USD', timezone: 'UTC' });

  const save = useMutation({
    mutationFn: async () => (await api.patch('/organizations/current', form)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organization'] }),
  });

  if (data && !form.name) setForm({ name: data.name, industry: data.industry ?? '', currency: data.currency, timezone: data.timezone });

  return (
    <div className="max-w-md space-y-4">
      <Field label="Company name">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="Industry">
        <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="Currency">
        <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          {['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        {save.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

function AITab() {
  const { data } = useQuery({ queryKey: ['organization'], queryFn: async () => (await api.get('/organizations/current')).data });
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState('none');

  const save = useMutation({
    mutationFn: async () => (await api.patch('/organizations/current/ai-settings', { aiProvider: provider, aiEnabled: provider !== 'none' })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organization'] }),
  });

  if (data?.settings && provider === 'none' && data.settings.aiProvider !== 'none') setProvider(data.settings.aiProvider);

  return (
    <div className="max-w-md space-y-4">
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
        The active provider (and its API key) is set via the server&apos;s <code>AI_PROVIDER</code> environment variable. This
        preference is stored for future per-organization routing once multi-provider key storage is added.
      </p>
      <Field label="Preferred AI provider">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="none">None (demo mode)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google Gemini</option>
        </select>
      </Field>
      <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        {save.isPending ? 'Saving…' : 'Save preference'}
      </button>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: async () => api.post('/auth/change-password', form),
    onSuccess: () => {
      setMessage('Password updated.');
      setForm({ currentPassword: '', newPassword: '' });
    },
    onError: (err: unknown) => setMessage(getApiErrorMessage(err, 'Could not change password')),
  });

  return (
    <div className="max-w-md space-y-4">
      <Field label="Current password">
        <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      <Field label="New password">
        <input type="password" minLength={8} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </Field>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      <button onClick={() => change.mutate()} disabled={change.isPending} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        {change.isPending ? 'Updating…' : 'Change password'}
      </button>
    </div>
  );
}

function CRMTab() {
  const queryClient = useQueryClient();
  const [entity, setEntity] = useState<'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL'>('LEAD');
  const [form, setForm] = useState({ label: '', fieldKey: '', type: 'TEXT' as CustomFieldType, isRequired: false });

  const { data: fields } = useQuery({
    queryKey: ['custom-fields', entity],
    queryFn: async () => (await api.get('/custom-fields', { params: { entity } })).data as { id: string; label: string; fieldKey: string; type: string; isRequired: boolean }[],
  });

  const create = useMutation({
    mutationFn: async () => (await api.post('/custom-fields', { entity, ...form })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', entity] });
      setForm({ label: '', fieldKey: '', type: 'TEXT', isRequired: false });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/custom-fields/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields', entity] }),
  });

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Custom fields for</p>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
          {(['LEAD', 'CONTACT', 'COMPANY', 'DEAL'] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEntity(e)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${entity === e ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {e.toLowerCase()}s
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
        className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-4"
      >
        <input required placeholder="Field label (e.g. Referral Code)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="col-span-2 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
        <input required placeholder="Field key (e.g. referralCode)" value={form.fieldKey} onChange={(e) => setForm({ ...form, fieldKey: e.target.value })} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CustomFieldType })} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm">
          {['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit" disabled={create.isPending} className="col-span-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          {create.isPending ? 'Adding…' : 'Add Field'}
        </button>
      </form>

      <div className="space-y-2">
        {fields?.length === 0 && <p className="text-xs text-slate-400">No custom fields for {entity.toLowerCase()}s yet.</p>}
        {fields?.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-800">{f.label}</p>
              <p className="text-xs text-slate-400">{f.fieldKey} · {f.type}</p>
            </div>
            <button onClick={() => remove.mutate(f.id)} className="text-xs font-medium text-red-500 hover:text-red-700">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingTab() {
  const { data: subscription } = useQuery({ queryKey: ['billing', 'subscription'], queryFn: async () => (await api.get('/billing/subscription')).data });
  const { data: usage } = useQuery({ queryKey: ['billing', 'usage'], queryFn: async () => (await api.get('/billing/usage')).data });

  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-xs uppercase text-slate-400">Current Plan</p>
        <p className="text-lg font-bold text-slate-900">{subscription?.plan ?? '—'}</p>
        <p className="text-sm text-slate-500">Status: {subscription?.status}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-400">AI requests this month</p>
          <p className="text-lg font-semibold text-slate-900">{usage?.aiRequestsThisMonth ?? 0} / {usage?.aiRequestLimit ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-400">Seats used</p>
          <p className="text-lg font-semibold text-slate-900">{usage?.seatsUsed ?? 0} / {usage?.seatLimit ?? 0}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Self-serve checkout requires a configured payment provider (Stripe, Paystack, or Flutterwave) — see BILLING_PROVIDER in your environment config.
      </p>
    </div>
  );
}

export function Settings() {
  const [tab, setTab] = useState<Tab>('Profile');

  return (
    <div className="p-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900">Settings</h1>
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && <ProfileTab />}
      {tab === 'Organization' && <OrganizationTab />}
      {tab === 'CRM' && <CRMTab />}
      {tab === 'AI' && <AITab />}
      {tab === 'Security' && <SecurityTab />}
      {tab === 'Billing' && <BillingTab />}
    </div>
  );
}
