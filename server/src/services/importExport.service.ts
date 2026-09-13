import { prisma } from '../config/prisma';
import { toCsv } from '../utils/csv';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

type ColumnMapping = Record<string, string>; // CRM field -> CSV header

function mapRow(row: Record<string, string>, mapping: ColumnMapping): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, csvHeader] of Object.entries(mapping)) {
    if (csvHeader && row[csvHeader] !== undefined) out[field] = row[csvHeader].trim();
  }
  return out;
}

// ── Leads ──────────────────────────────────────────────────────────────

export async function importLeads(organizationId: string, rows: Record<string, string>[], mapping: ColumnMapping): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const mapped = mapRow(rows[i], mapping);
    if (!mapped.firstName || !mapped.lastName) {
      result.errors.push({ row: i + 2, message: 'Missing required firstName/lastName' });
      result.skipped += 1;
      continue;
    }

    if (mapped.email) {
      // eslint-disable-next-line no-await-in-loop
      const duplicate = await prisma.lead.findFirst({ where: { organizationId, email: mapped.email, deletedAt: null } });
      if (duplicate) {
        result.errors.push({ row: i + 2, message: `Duplicate email skipped: ${mapped.email}` });
        result.skipped += 1;
        continue;
      }
    }

    // eslint-disable-next-line no-await-in-loop
    await prisma.lead.create({
      data: {
        organizationId,
        firstName: mapped.firstName,
        lastName: mapped.lastName,
        email: mapped.email || undefined,
        phone: mapped.phone || undefined,
        companyName: mapped.companyName || undefined,
        jobTitle: mapped.jobTitle || undefined,
        industry: mapped.industry || undefined,
        source: mapped.source || 'CSV Import',
        estimatedValue: mapped.estimatedValue ? Number(mapped.estimatedValue) || undefined : undefined,
      },
    });
    result.imported += 1;
  }

  return result;
}

export async function exportLeads(organizationId: string): Promise<string> {
  const leads = await prisma.lead.findMany({ where: { organizationId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  const columns = ['firstName', 'lastName', 'email', 'phone', 'companyName', 'jobTitle', 'industry', 'source', 'status', 'leadScore', 'estimatedValue', 'createdAt'];
  return toCsv(
    leads.map((l) => ({
      firstName: l.firstName,
      lastName: l.lastName,
      email: l.email ?? '',
      phone: l.phone ?? '',
      companyName: l.companyName ?? '',
      jobTitle: l.jobTitle ?? '',
      industry: l.industry ?? '',
      source: l.source ?? '',
      status: l.status,
      leadScore: l.leadScore ?? '',
      estimatedValue: l.estimatedValue ?? '',
      createdAt: l.createdAt.toISOString(),
    })),
    columns,
  );
}

// ── Contacts ───────────────────────────────────────────────────────────

export async function importContacts(organizationId: string, rows: Record<string, string>[], mapping: ColumnMapping): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const mapped = mapRow(rows[i], mapping);
    if (!mapped.firstName || !mapped.lastName) {
      result.errors.push({ row: i + 2, message: 'Missing required firstName/lastName' });
      result.skipped += 1;
      continue;
    }

    let companyId: string | undefined;
    if (mapped.companyName) {
      // eslint-disable-next-line no-await-in-loop
      const company = await prisma.company.findFirst({ where: { organizationId, name: mapped.companyName, deletedAt: null } });
      companyId = company?.id;
    }

    // eslint-disable-next-line no-await-in-loop
    await prisma.contact.create({
      data: {
        organizationId,
        firstName: mapped.firstName,
        lastName: mapped.lastName,
        email: mapped.email || undefined,
        phone: mapped.phone || undefined,
        jobTitle: mapped.jobTitle || undefined,
        companyId,
      },
    });
    result.imported += 1;
  }

  return result;
}

export async function exportContacts(organizationId: string): Promise<string> {
  const contacts = await prisma.contact.findMany({
    where: { organizationId, deletedAt: null },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const columns = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'companyName', 'createdAt'];
  return toCsv(
    contacts.map((c) => ({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? '',
      phone: c.phone ?? '',
      jobTitle: c.jobTitle ?? '',
      companyName: c.company?.name ?? '',
      createdAt: c.createdAt.toISOString(),
    })),
    columns,
  );
}

// ── Companies ──────────────────────────────────────────────────────────

export async function importCompanies(organizationId: string, rows: Record<string, string>[], mapping: ColumnMapping): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const mapped = mapRow(rows[i], mapping);
    if (!mapped.name) {
      result.errors.push({ row: i + 2, message: 'Missing required name' });
      result.skipped += 1;
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const duplicate = await prisma.company.findFirst({ where: { organizationId, name: mapped.name, deletedAt: null } });
    if (duplicate) {
      result.errors.push({ row: i + 2, message: `Duplicate company skipped: ${mapped.name}` });
      result.skipped += 1;
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    await prisma.company.create({
      data: {
        organizationId,
        name: mapped.name,
        website: mapped.website || undefined,
        industry: mapped.industry || undefined,
        companySize: mapped.companySize || undefined,
        location: mapped.location || undefined,
        phone: mapped.phone || undefined,
        email: mapped.email || undefined,
      },
    });
    result.imported += 1;
  }

  return result;
}

export async function exportCompanies(organizationId: string): Promise<string> {
  const companies = await prisma.company.findMany({ where: { organizationId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  const columns = ['name', 'website', 'industry', 'companySize', 'location', 'phone', 'email', 'createdAt'];
  return toCsv(
    companies.map((c) => ({
      name: c.name,
      website: c.website ?? '',
      industry: c.industry ?? '',
      companySize: c.companySize ?? '',
      location: c.location ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      createdAt: c.createdAt.toISOString(),
    })),
    columns,
  );
}
