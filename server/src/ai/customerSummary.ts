import { prisma } from '../config/prisma';
import { getAIProvider } from '../ai';
import { recordAIUsage } from './usage';

async function buildContext(entity: 'contact' | 'company', organizationId: string, id: string) {
  if (entity === 'contact') {
    const contact = await prisma.contact.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { company: true, deals: true, activities: { orderBy: { occurredAt: 'desc' }, take: 10 } },
    });
    if (!contact) throw new Error('Contact not found');
    return {
      record: contact,
      description: `${contact.firstName} ${contact.lastName}${contact.jobTitle ? `, ${contact.jobTitle}` : ''}${contact.company ? ` at ${contact.company.name}` : ''}. ${contact.deals.length} associated deal(s). Recent activity: ${contact.activities.map((a) => `${a.type} — ${a.subject}`).join('; ') || 'none recorded'}.`,
    };
  }
  const company = await prisma.company.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: { deals: true, contacts: true, activities: { orderBy: { occurredAt: 'desc' }, take: 10 } },
  });
  if (!company) throw new Error('Company not found');
  return {
    record: company,
    description: `${company.name}${company.industry ? `, ${company.industry}` : ''}${company.companySize ? `, ${company.companySize} employees` : ''}. ${company.contacts.length} contact(s), ${company.deals.length} deal(s). Recent activity: ${company.activities.map((a) => `${a.type} — ${a.subject}`).join('; ') || 'none recorded'}.`,
  };
}

export async function summarizeCustomer(organizationId: string, entity: 'contact' | 'company', id: string, userId?: string) {
  const { description } = await buildContext(entity, organizationId, id);
  const provider = getAIProvider();

  let summary = `${description} (Enable an AI provider in Settings → AI for a narrative summary with buying signals and risks.)`;

  if (provider.name !== 'demo') {
    const result = await provider.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a sales analyst. Write a 3-4 sentence customer summary covering profile, recent interactions, buying signals or risks, and a recommended next action. No preamble.',
        },
        { role: 'user', content: description },
      ],
      maxTokens: 300,
    });
    if (result.content) summary = result.content.trim();
    await recordAIUsage(organizationId, { operation: 'summary', provider: provider.name, promptTokens: result.promptTokens, completionTokens: result.completionTokens, userId });
  }

  if (entity === 'contact') {
    await prisma.contact.update({ where: { id }, data: { aiSummary: summary, aiSummaryUpdatedAt: new Date() } });
  } else {
    await prisma.company.update({ where: { id }, data: { aiSummary: summary, aiSummaryUpdatedAt: new Date() } });
  }

  return summary;
}
