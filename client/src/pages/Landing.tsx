import { Link, Navigate } from 'react-router-dom';
import {
  Sparkles,
  KanbanSquare,
  TrendingUp,
  Mail,
  BarChart3,
  Zap,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CRM_FEATURES = [
  { icon: KanbanSquare, title: 'Visual sales pipeline', desc: 'Drag-and-drop Kanban board across fully customizable stages, from first touch to closed won.' },
  { icon: TrendingUp, title: 'Lead & deal management', desc: 'Capture, score, and route leads automatically. Track every opportunity with full activity history.' },
  { icon: BarChart3, title: 'Analytics & reporting', desc: 'Real revenue, conversion, and team performance dashboards — build custom reports in minutes.' },
  { icon: Zap, title: 'Sales automation', desc: 'Trigger tasks, notifications, and follow-ups automatically when leads or deals change state.' },
];

const AI_FEATURES = [
  { icon: Sparkles, title: 'AI lead scoring', desc: 'Every lead gets a live score, temperature, and recommended next action — no manual triage.' },
  { icon: TrendingUp, title: 'Deal intelligence & forecasting', desc: 'AI flags at-risk deals before they stall and forecasts revenue from your actual weighted pipeline.' },
  { icon: Mail, title: 'AI email assistant', desc: 'Generate, rewrite, and personalize outreach in seconds across seven tones and use cases.' },
  { icon: Sparkles, title: 'AI sales assistant', desc: 'Ask "which deals are at risk this month?" in plain English and get answers grounded in your real data.' },
];

const PLANS = [
  { name: 'Free', price: '$0', period: '', tagline: 'For trying it out', features: ['Up to 2 seats', 'Core CRM: leads, contacts, companies, deals', 'Single pipeline', '20 AI requests / month'] },
  { name: 'Starter', price: '$29', period: '/user/mo', tagline: 'For small sales teams', features: ['Up to 5 seats', 'AI lead scoring & email assistant', 'Task automation', '200 AI requests / month'], highlighted: false },
  { name: 'Professional', price: '$79', period: '/user/mo', tagline: 'For growing revenue teams', features: ['Up to 20 seats', 'AI deal intelligence & forecasting', 'Advanced automation', 'Custom reports', '1,000 AI requests / month'], highlighted: true },
  { name: 'Enterprise', price: 'Custom', period: '', tagline: 'For scaling organizations', features: ['Unlimited seats', 'Enterprise controls & audit logs', 'Priority support', '10,000+ AI requests / month'] },
];

const FAQS = [
  { q: 'Do I need an AI provider API key to use SalesPilot AI?', a: 'No. The full CRM works out of the box. AI features (scoring, forecasting, email drafts, chat) run in a guided demo mode until you connect an OpenAI, Anthropic, or Google Gemini key in Settings.' },
  { q: 'Can I import my existing leads and contacts?', a: 'Yes — CSV import with column mapping and duplicate detection is built into the Leads, Contacts, and Companies modules.' },
  { q: 'Is my data isolated from other organizations?', a: 'Every record is scoped to your organization at the database query level. No user outside your organization can ever access your data.' },
  { q: 'What happens if I exceed my plan\'s AI request limit?', a: 'The CRM keeps working normally — only AI-specific actions pause until your usage resets next month or you upgrade your plan.' },
];

function LandingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SalesPilot AI" className="h-8 w-8 rounded" />
          <span className="text-sm font-bold text-brand-900">SalesPilot AI</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#ai" className="hover:text-slate-900">AI</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          <a href="#faq" className="hover:text-slate-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
          <Link to="/register" className="rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Landing() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="bg-white">
      <LandingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Sparkles className="h-3.5 w-3.5" /> AI-powered CRM for revenue teams
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Turn Every Lead Into Revenue <span className="text-brand-600">With AI</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          An intelligent CRM platform that helps sales teams find opportunities, prioritize prospects, automate
          follow-ups, and close more deals.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/register" className="flex items-center gap-1.5 rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#features" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            See how it works
          </a>
        </div>
        <p className="mt-4 text-xs text-slate-400">No credit card required · Free plan available</p>
      </section>

      {/* Trusted by */}
      <section className="border-y border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Built for startups, agencies, and enterprise sales teams
          </p>
        </div>
      </section>

      {/* CRM Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">Everything your sales team needs</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Leads, pipeline, tasks, and reporting in one clean workspace — no bolted-together tools.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CRM_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="h-4 w-4 text-brand-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI capabilities */}
      <section id="ai" className="bg-brand-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold">AI built into every part of the workflow</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-brand-100">
            Not a chatbot bolted on — AI that scores, explains, drafts, and forecasts using your actual CRM data.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AI_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-brand-100" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-brand-100/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { step: '1', title: 'Import or capture leads', desc: 'Bring in existing leads via CSV or capture new ones straight into the CRM.' },
            { step: '2', title: 'Let AI prioritize', desc: 'Every lead is scored and every deal gets a health check — no manual triage.' },
            { step: '3', title: 'Close faster', desc: 'Automated follow-ups and AI-drafted outreach keep every deal moving.' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {s.step}
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials (fictional, illustrative) */}
      <section className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">What early teams say</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { quote: 'We cut our lead response time in half just by letting the AI tell us who to call first.', name: 'Head of Sales, mid-market SaaS' },
              { quote: 'The deal risk alerts caught two stalled opportunities we would have lost otherwise.', name: 'Sales Manager, logistics company' },
              { quote: 'Finally a CRM our reps actually update, because the pipeline view is fast and clear.', name: 'RevOps Lead, agency' },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-3 text-xs font-medium text-slate-400">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-slate-900">Simple, transparent pricing</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">Start free. Upgrade as your pipeline grows.</p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-xl border p-6 ${p.highlighted ? 'border-brand-600 shadow-lg shadow-brand-100' : 'border-slate-200'}`}
            >
              {p.highlighted && <span className="mb-2 inline-block rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Most popular</span>}
              <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-xs text-slate-400">{p.tagline}</p>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">
                {p.price}<span className="text-sm font-medium text-slate-400">{p.period}</span>
              </p>
              <ul className="mt-5 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-semibold ${
                  p.highlighted ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mt-10 space-y-4">
            {FAQS.map((f) => (
              <details key={f.q} className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">{f.q}</summary>
                <p className="mt-2 text-sm text-slate-500">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Ready to turn more leads into revenue?</h2>
        <p className="mt-2 text-slate-500">Set up your workspace in under two minutes. No credit card required.</p>
        <Link to="/register" className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          Start free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SalesPilot AI" className="h-6 w-6 rounded" />
            <span className="text-xs font-semibold text-slate-500">© {new Date().getFullYear()} SalesPilot AI</span>
          </div>
          <div className="flex gap-5 text-xs text-slate-400">
            <Link to="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-600">Terms of Service</Link>
            <a href="mailto:hello@salespilot.ai" className="hover:text-slate-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
