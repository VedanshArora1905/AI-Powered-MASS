import { prisma } from '@mass/db';
import type { AgentType, MessageRole } from '@mass/db';
import { routerAgent } from './routerAgent';

type IncomingMessagePayload = {
  conversationId?: string;
  userId?: string;
  content: string;
};

export const chatService = {
  async handleIncomingMessage(payload: IncomingMessagePayload) {
    const userId = payload.userId ?? (await ensureDemoUser()).id;

    const conversation =
      payload.conversationId != null
        ? await prisma.conversation.update({
            where: { id: payload.conversationId },
            data: {
              updatedAt: new Date(),
            },
          })
        : await prisma.conversation.create({
            data: {
              userId,
              title: payload.content.slice(0, 80),
            },
          });

    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER' satisfies MessageRole,
        content: payload.content,
      },
    });

    const routerResult = await routerAgent.route({
      conversationId: conversation.id,
      latestUserMessage: userMessage,
      userId,
    });

    const agentMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'AGENT' satisfies MessageRole,
        agentType: routerResult.agentType as AgentType,
        content: routerResult.reply,
      },
    });

    return {
      conversationId: conversation.id,
      messages: [userMessage, agentMessage],
      agentType: routerResult.agentType,
    };
  },

  async *handleIncomingMessageStream(payload: IncomingMessagePayload) {
    const result = await this.handleIncomingMessage(payload);

    const fullText =
      result.messages.find((m) => m.role === 'AGENT')?.content ?? '';

    // First yield metadata so the client knows conversation & agent
    yield {
      type: 'meta' as const,
      conversationId: result.conversationId,
      agentType: result.agentType,
    };

    const tokens = fullText.split(' ');
    for (const token of tokens) {
      yield {
        type: 'delta' as const,
        delta: `${token} `,
      };
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  },

  async listConversations(_args?: { userId?: string }) {
    const user = await ensureDemoUser();
    return prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getConversation({ id }: { id: string; userId?: string }) {
    const user = await ensureDemoUser();
    return prisma.conversation.findFirstOrThrow({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async deleteConversation({ id }: { id: string; userId?: string }) {
    const user = await ensureDemoUser();
    await prisma.conversation.delete({
      where: { id, userId: user.id },
    });
  },
};

async function ensureDemoUser() {
  const existing = await prisma.user.findFirst({
    where: { email: 'demo@mass.dev' },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      email: 'demo@mass.dev',
      name: 'Demo User',
    },
  });
}


