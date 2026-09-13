import { prisma } from '../config/prisma';
import { getAIProvider } from '../ai';
import { AI_TOOL_DEFINITIONS, executeAITool } from './tools';
import { recordAIUsage } from './usage';
import type { AIMessageInput } from './AIProvider';

const SYSTEM_PROMPT = `You are the AI Sales Assistant inside SalesPilot AI, a CRM. Answer questions about the user's leads, deals, pipeline, and team using the provided tools — never invent data. Use getLeads/getDeals/getSalesMetrics/getPipeline/getActivities/getTeamPerformance to look things up before answering. Be concise and actionable. If asked to do something outside CRM data (e.g. write code, discuss unrelated topics), politely decline and redirect to sales-related help.`;

const MAX_TOOL_ROUNDS = 4;

export async function sendChatMessage(params: {
  organizationId: string;
  userId: string;
  conversationId?: string;
  message: string;
}) {
  const conversation = params.conversationId
    ? await prisma.aIConversation.findFirst({
        where: { id: params.conversationId, organizationId: params.organizationId, userId: params.userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  const thread =
    conversation ??
    (await prisma.aIConversation.create({
      data: { organizationId: params.organizationId, userId: params.userId, title: params.message.slice(0, 60) },
      include: { messages: true },
    }));

  await prisma.aIMessage.create({ data: { conversationId: thread.id, role: 'user', content: params.message } });

  const provider = getAIProvider();
  const history: AIMessageInput[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...thread.messages.map((m) => ({ role: m.role as AIMessageInput['role'], content: m.content })),
    { role: 'user', content: params.message },
  ];

  let finalContent = '';
  let round = 0;

  // eslint-disable-next-line no-constant-condition
  while (round < MAX_TOOL_ROUNDS) {
    round += 1;
    const result = await provider.complete({ messages: history, tools: AI_TOOL_DEFINITIONS, maxTokens: 800 });

    await recordAIUsage(params.organizationId, {
      operation: 'chat',
      provider: provider.name,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      userId: params.userId,
    });

    if (result.toolCalls.length === 0) {
      finalContent = result.content ?? 'I was unable to generate a response.';
      break;
    }

    // Authorization is implicit here: every tool executor takes
    // organizationId/userId from THIS server-side context, not from the
    // model's tool-call arguments — so even a manipulated tool call cannot
    // reach another tenant's data.
    for (const call of result.toolCalls) {
      // eslint-disable-next-line no-await-in-loop
      const toolResult = await executeAITool(call.name, call.arguments, { organizationId: params.organizationId, userId: params.userId });
      history.push({ role: 'assistant', content: `Called tool ${call.name}` });
      history.push({ role: 'tool', content: JSON.stringify(toolResult), toolCallId: call.id, name: call.name });
    }
  }

  if (!finalContent) finalContent = "I gathered the data but couldn't finish reasoning about it — try rephrasing your question.";

  const assistantMessage = await prisma.aIMessage.create({
    data: { conversationId: thread.id, role: 'assistant', content: finalContent },
  });

  return { conversationId: thread.id, message: assistantMessage };
}

export async function listConversations(organizationId: string, userId: string) {
  return prisma.aIConversation.findMany({
    where: { organizationId, userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function getConversation(organizationId: string, userId: string, id: string) {
  return prisma.aIConversation.findFirst({
    where: { id, organizationId, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}
