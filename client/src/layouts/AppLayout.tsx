import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
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
  FileBarChart,
  Zap,
  Users2,
  Settings,
  LogOut,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { NotificationBell } from '@/components/NotificationBell';
import { CommandPalette } from '@/components/CommandPalette';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/contacts', label: 'Contacts', icon: UserSquare2 },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/deals', label: 'Deals', icon: Handshake },
  { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/automation', label: 'Automation', icon: Zap },
  { to: '/team', label: 'Team', icon: Users2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string | null;
}

const ROUTE_FOR_TYPE: Record<string, string> = {
  lead: '/leads',
  contact: '/contacts',
  company: '/companies',
  deal: '/deals',
  task: '/tasks',
};

function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const { data } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => (await api.get('/search', { params: { q: query } })).data.results as SearchResult[],
    enabled: query.trim().length >= 2,
  });

  return (
    <div className="relative w-80">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search leads, deals, contacts…"
        className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-8 pr-14 text-sm focus:border-brand-400 focus:bg-white focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</kbd>
      {focused && query.trim().length >= 2 && (
        <div className="absolute left-0 top-10 z-30 max-h-80 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {data?.length === 0 && <p className="p-3 text-xs text-slate-400">No results.</p>}
          {data?.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => {
                const base = ROUTE_FOR_TYPE[r.type] ?? '/dashboard';
                navigate(r.type === 'task' ? base : `${base}/${r.id}`);
                setQuery('');
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="text-slate-800">{r.title}</span>
              <span className="text-xs capitalize text-slate-400">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <CommandPalette />
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <img src="/logo.png" alt="SalesPilot AI" className="h-8 w-8 rounded" />
          <div>
            <p className="text-sm font-bold leading-none text-brand-900">SalesPilot AI</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Smarter Sales</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center justify-between rounded-md px-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2.5">
          <GlobalSearch />
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
