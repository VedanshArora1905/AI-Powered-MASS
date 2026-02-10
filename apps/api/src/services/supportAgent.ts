import type { AgentType } from '@mass/db';
import { prisma } from '@mass/db';

import type { Message } from '@mass/db';

type AgentHandleInput = {
  userId: string;
  conversationId: string;
  latestUserMessage: Message;
};

export const supportAgent = {
  async handle(input: AgentHandleInput): Promise<{ agentType: AgentType; reply: string }> {
    // Tool: use recent conversation history for more contextual reply
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: input.conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const lastUserMessage = input.latestUserMessage.content;

    // For now, return a deterministic, testable response instead of calling an LLM.
    const reply = `Support Agent: I see your recent messages: "${recentMessages
      .map((m) => m.content)
      .join(' | ')}". Based on your latest message "${lastUserMessage}", here are some general troubleshooting steps.`;

    return {
      agentType: 'SUPPORT',
      reply,
    };
  },
};


