import type { AgentType } from '@mass/db';
import type { Message } from '@mass/db';
import { getConversationContext } from './contextService';

type AgentHandleInput = {
  userId: string;
  conversationId: string;
  latestUserMessage: Message;
};

export const supportAgent = {
  async handle(input: AgentHandleInput): Promise<{ agentType: AgentType; reply: string }> {
    // Tool: use compacted conversation history for more contextual reply
    const context = await getConversationContext(input.conversationId, {
      maxMessages: 20,
    });

    const lastUserMessage = input.latestUserMessage.content;

    // For now, return a deterministic, testable response instead of calling an LLM.
    const reply = `Support Agent: I see your recent messages: "${context.messages
      .map((m) => m.content)
      .join(' | ')}"${
      context.truncated ? ` (${context.summary})` : ''
    }. Based on your latest message "${lastUserMessage}", here are some general troubleshooting steps.`;

    return {
      agentType: 'SUPPORT',
      reply,
    };
  },
};


