import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errorMessage';

interface Member {
  userId: string;
  role: string;
  status: string;
  joinedAt: string | null;
  invitedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

const ROLES = ['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER'];
const INVITABLE_ROLES = ['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER'];

const roleColors: Record<string, string> = {
  OWNER: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  SALES_MANAGER: 'bg-emerald-100 text-emerald-700',
  SALES_REP: 'bg-slate-100 text-slate-600',
  MARKETING: 'bg-amber-100 text-amber-700',
  VIEWER: 'bg-slate-100 text-slate-500',
};

export function Team() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'SALES_REP' });

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/organizations/current/members')).data as Member[],
  });

  const invite = useMutation({
    mutationFn: async () => (await api.post('/organizations/current/members/invite', inviteForm)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowInvite(false);
      setInviteForm({ email: '', role: 'SALES_REP' });
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) =>
      (await api.patch(`/organizations/current/members/${userId}`, { role })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => api.delete(`/organizations/current/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team</h1>
          <p className="text-sm text-slate-500">{members?.length ?? 0} members</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <UserPlus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {showInvite && (
        <form
          onSubmit={(e) => { e.preventDefault(); invite.mutate(); }}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input required type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
            <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {INVITABLE_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button type="submit" disabled={invite.isPending} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            {invite.isPending ? 'Sending…' : 'Send Invite'}
          </button>
          <button type="button" onClick={() => setShowInvite(false)} className="rounded-md border border-slate-300 px-3 py-2 text-slate-500 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
          {invite.isError && (
            <p className="w-full text-sm text-red-600">{getApiErrorMessage(invite.error, 'Could not send invite')}</p>
          )}
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {members?.map((m) => (
              <tr key={m.userId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{m.user.firstName} {m.user.lastName}</td>
                <td className="px-4 py-3 text-slate-600">{m.user.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'invited' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {m.status === 'invited' ? 'Pending' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.role}
                    onChange={(e) => changeRole.mutate({ userId: m.userId, role: e.target.value })}
                    className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${roleColors[m.role] ?? 'bg-slate-100'}`}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove.mutate(m.userId)} className="text-xs font-medium text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
