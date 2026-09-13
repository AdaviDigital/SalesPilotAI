import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <img src="/logo.png" alt="SalesPilot AI" className="h-7 w-7 rounded" />
          <Link to="/" className="text-sm font-bold text-brand-900">SalesPilot AI</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">Last updated: {updated}</p>
        <div className="prose prose-slate mt-8 max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
          {children}
        </div>
      </main>
    </div>
  );
}
