import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';
import { ImportModal } from '@/components/ImportModal';

const STEPS = [
  'Create Organization',
  'Business Information',
  'Industry',
  'Team Size',
  'Sales Pipeline',
  'Import Leads',
  'Configure AI',
  'Complete Setup',
] as const;

const CURRENCIES = ['USD', 'NGN', 'GBP', 'EUR', 'CAD', 'AUD'];
const INDUSTRIES = ['Technology', 'Financial Services', 'Healthcare', 'Real Estate', 'Retail', 'Manufacturing', 'Consulting', 'Logistics', 'Other'];
const TEAM_SIZES = ['1-5', '6-20', '21-50', '51-200', '200+'];

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function OnboardingWizard() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const [account, setAccount] = useState({ firstName: '', lastName: '', email: '', password: '', organizationName: '' });
  const [business, setBusiness] = useState({ currency: 'USD', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const [industry, setIndustry] = useState('Technology');
  const [teamSize, setTeamSize] = useState('1-5');
  const [aiProvider, setAiProvider] = useState('none');

  const createAccount = useMutation({
    mutationFn: async () => register(account),
    onError: (err: unknown) => setError(getApiErrorMessage(err, 'Could not create account')),
  });

  const { data: pipeline } = useQuery({
    queryKey: ['pipelines', 'onboarding'],
    queryFn: async () => (await api.get('/pipelines')).data[0],
    enabled: step === 4,
  });

  const saveBusinessInfo = useMutation({
    mutationFn: async () => api.patch('/organizations/current', business),
  });
  const saveIndustry = useMutation({
    mutationFn: async () => api.patch('/organizations/current', { industry }),
  });
  const saveTeamSize = useMutation({
    mutationFn: async () => api.patch('/organizations/current', { teamSize }),
  });
  const saveAI = useMutation({
    mutationFn: async () => api.patch('/organizations/current/ai-settings', { aiProvider, aiEnabled: aiProvider !== 'none' }),
  });

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <img src="/logo.png" alt="SalesPilot AI" className="mb-3 h-12 w-12 rounded-lg" />
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {step === 0 && (
          <StepShell title="Create your organization" subtitle="This becomes your team's workspace.">
            <form
              onSubmit={(e) => { e.preventDefault(); createAccount.mutate(undefined, { onSuccess: next }); }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First name" value={account.firstName} onChange={(e) => setAccount({ ...account, firstName: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input required placeholder="Last name" value={account.lastName} onChange={(e) => setAccount({ ...account, lastName: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <input required placeholder="Company name" value={account.organizationName} onChange={(e) => setAccount({ ...account, organizationName: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input required type="email" placeholder="Work email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <input required type="password" minLength={8} placeholder="Password" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={createAccount.isPending} className="w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                {createAccount.isPending ? 'Creating…' : 'Continue'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account? <Link to="/login" className="font-medium text-brand-600">Sign in</Link>
            </p>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title="Business information" subtitle="Used for currency formatting and scheduling across the CRM.">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
                <select value={business.currency} onChange={(e) => setBusiness({ ...business, currency: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Timezone</label>
                <input value={business.timezone} onChange={(e) => setBusiness({ ...business, timezone: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <button
                onClick={() => saveBusinessInfo.mutate(undefined, { onSuccess: next })}
                disabled={saveBusinessInfo.isPending}
                className="w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {saveBusinessInfo.isPending ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="What industry are you in?">
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map((i) => (
                <button
                  key={i}
                  onClick={() => setIndustry(i)}
                  className={`rounded-md border px-3 py-2 text-sm ${industry === i ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <button
              onClick={() => saveIndustry.mutate(undefined, { onSuccess: next })}
              disabled={saveIndustry.isPending}
              className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {saveIndustry.isPending ? 'Saving…' : 'Continue'}
            </button>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="How big is your sales team?">
            <div className="grid grid-cols-1 gap-2">
              {TEAM_SIZES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTeamSize(t)}
                  className={`rounded-md border px-3 py-2.5 text-left text-sm ${teamSize === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {t} people
                </button>
              ))}
            </div>
            <button
              onClick={() => saveTeamSize.mutate(undefined, { onSuccess: next })}
              disabled={saveTeamSize.isPending}
              className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {saveTeamSize.isPending ? 'Saving…' : 'Continue'}
            </button>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="Your sales pipeline" subtitle="We've set up a default pipeline — you can customize stages any time in Settings.">
            <div className="space-y-1.5">
              {pipeline?.stages?.map((s: { id: string; name: string }) => (
                <div key={s.id} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <Check className="h-3.5 w-3.5 text-brand-600" /> {s.name}
                </div>
              ))}
              {!pipeline && <p className="text-sm text-slate-400">Loading your pipeline…</p>}
            </div>
            <button onClick={next} className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Looks good, continue
            </button>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="Import your leads" subtitle="Bring in existing leads from a CSV, or skip and add them later.">
            <div className="space-y-3">
              <button onClick={() => setShowImport(true)} className="w-full rounded-md border border-brand-200 bg-brand-50 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">
                Upload a CSV file
              </button>
              <button onClick={next} className="w-full rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Skip for now
              </button>
            </div>
            {showImport && (
              <ImportModal
                entity="leads"
                invalidateKey="leads"
                onClose={() => { setShowImport(false); next(); }}
                fields={[
                  { key: 'firstName', label: 'First Name', required: true },
                  { key: 'lastName', label: 'Last Name', required: true },
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'companyName', label: 'Company' },
                  { key: 'jobTitle', label: 'Job Title' },
                  { key: 'source', label: 'Source' },
                ]}
              />
            )}
          </StepShell>
        )}

        {step === 6 && (
          <StepShell title="Configure AI" subtitle="Optional — the CRM works fully without this. Add an API key later in Settings to activate it.">
            <div className="space-y-2">
              {[
                { value: 'none', label: 'Skip for now (demo mode)' },
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'google', label: 'Google Gemini' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setAiProvider(p.value)}
                  className={`w-full rounded-md border px-3 py-2.5 text-left text-sm ${aiProvider === p.value ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => saveAI.mutate(undefined, { onSuccess: next })}
              disabled={saveAI.isPending}
              className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {saveAI.isPending ? 'Saving…' : 'Continue'}
            </button>
          </StepShell>
        )}

        {step === 7 && (
          <StepShell title="You're all set!" subtitle="Your SalesPilot AI workspace is ready.">
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p>✓ Organization created</p>
              <p>✓ Pipeline configured</p>
              <p>✓ {aiProvider === 'none' ? 'AI in demo mode — add a key anytime' : `AI provider set to ${aiProvider}`}</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="mt-4 w-full rounded-md bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Go to Dashboard
            </button>
          </StepShell>
        )}

        {step > 0 && step < 7 && (
          <button onClick={back} className="mt-4 text-xs font-medium text-slate-400 hover:text-slate-600">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
