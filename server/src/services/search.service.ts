import { prisma } from '../config/prisma';

export interface SearchResult {
  type: 'lead' | 'contact' | 'company' | 'deal' | 'task';
  id: string;
  title: string;
  subtitle: string | null;
}

export async function globalSearch(organizationId: string, query: string): Promise<SearchResult[]> {
  if (query.trim().length < 2) return [];
  const q = query.trim();
  const insensitive = { contains: q, mode: 'insensitive' as const };

  const [leads, contacts, companies, deals, tasks] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId, deletedAt: null, OR: [{ firstName: insensitive }, { lastName: insensitive }, { email: insensitive }, { companyName: insensitive }] },
      take: 5,
      select: { id: true, firstName: true, lastName: true, companyName: true },
    }),
    prisma.contact.findMany({
      where: { organizationId, deletedAt: null, OR: [{ firstName: insensitive }, { lastName: insensitive }, { email: insensitive }] },
      take: 5,
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.company.findMany({
      where: { organizationId, deletedAt: null, name: insensitive },
      take: 5,
      select: { id: true, name: true, industry: true },
    }),
    prisma.deal.findMany({
      where: { organizationId, deletedAt: null, name: insensitive },
      take: 5,
      select: { id: true, name: true, value: true },
    }),
    prisma.task.findMany({
      where: { organizationId, title: insensitive },
      take: 5,
      select: { id: true, title: true, status: true },
    }),
  ]);

  return [
    ...leads.map((l) => ({ type: 'lead' as const, id: l.id, title: `${l.firstName} ${l.lastName}`, subtitle: l.companyName })),
    ...contacts.map((c) => ({ type: 'contact' as const, id: c.id, title: `${c.firstName} ${c.lastName}`, subtitle: c.email })),
    ...companies.map((c) => ({ type: 'company' as const, id: c.id, title: c.name, subtitle: c.industry })),
    ...deals.map((d) => ({ type: 'deal' as const, id: d.id, title: d.name, subtitle: `$${Number(d.value).toLocaleString()}` })),
    ...tasks.map((t) => ({ type: 'task' as const, id: t.id, title: t.title, subtitle: t.status })),
  ];
}
