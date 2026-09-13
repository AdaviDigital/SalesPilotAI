import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  LayoutDashboard,
  Users,
  UserSquare2,
  Building2,
  Handshake,
  KanbanSquare,
  ListChecks,
  Calendar,
  Sparkles,
  BarChart3,
  Settings,
} from 'lucide-react';
import { api } from '@/lib/api';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
}

const NAV_COMMANDS = [
  { label: 'Go to Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Go to Leads', to: '/leads', icon: Users },
  { label: 'Go to Contacts', to: '/contacts', icon: UserSquare2 },
  { label: 'Go to Companies', to: '/companies', icon: Building2 },
  { label: 'Go to Deals', to: '/deals', icon: Handshake },
  { label: 'Go to Pipeline', to: '/pipeline', icon: KanbanSquare },
  { label: 'Go to Tasks', to: '/tasks', icon: ListChecks },
  { label: 'Go to Calendar', to: '/calendar', icon: Calendar },
  { label: 'Go to AI Assistant', to: '/ai-assistant', icon: Sparkles },
  { label: 'Go to Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Go to Settings', to: '/settings', icon: Settings },
];

const ROUTE_FOR_TYPE: Record<string, string> = {
  lead: '/leads',
  contact: '/contacts',
  company: '/companies',
  deal: '/deals',
  task: '/tasks',
};

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const { data: results } = useQuery({
    queryKey: ['command-search', query],
    queryFn: async () => (await api.get('/search', { params: { q: query } })).data.results as SearchResult[],
    enabled: query.trim().length >= 2,
  });

  const filteredNav = NAV_COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to…"
            className="flex-1 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {query.trim().length < 2 && (
            <>
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase text-slate-400">Navigate</p>
              {filteredNav.map((c) => (
                <button
                  key={c.to}
                  onClick={() => { navigate(c.to); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <c.icon className="h-3.5 w-3.5 text-slate-400" /> {c.label}
                </button>
              ))}
            </>
          )}
          {query.trim().length >= 2 && (
            <>
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase text-slate-400">Results</p>
              {results?.length === 0 && <p className="px-2.5 py-3 text-xs text-slate-400">No results.</p>}
              {results?.map((r) => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => {
                    const base = ROUTE_FOR_TYPE[r.type] ?? '/dashboard';
                    navigate(r.type === 'task' ? base : `${base}/${r.id}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="text-slate-700">{r.title}</span>
                  <span className="text-xs capitalize text-slate-400">{r.type}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
