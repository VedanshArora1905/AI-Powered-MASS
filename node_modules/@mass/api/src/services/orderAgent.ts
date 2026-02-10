import type { AgentType } from '@mass/db';
import { prisma } from '@mass/db';
import type { Message } from '@mass/db';
import { getConversationContext } from './contextService';

type AgentHandleInput = {
  userId: string;
  conversationId: string;
  latestUserMessage: Message;
};

export const orderAgent = {
  async handle(input: AgentHandleInput): Promise<{ agentType: AgentType; reply: string }> {
    const text = input.latestUserMessage.content;

    // Compact context, primarily for future LLM usage or richer heuristics
    const context = await getConversationContext(input.conversationId, {
      maxMessages: 10,
    });

    // Tool: fetch order details, check delivery status
    const externalIdMatch = text.match(/ORD-\d+/i);
    const externalId = externalIdMatch?.[0].toUpperCase();

    const orders = await prisma.order.findMany({
      where: {
        userId: input.userId,
        ...(externalId ? { externalId } : {}),
      },
    });

    if (!orders.length) {
      return {
        agentType: 'ORDER',
        reply:
          externalId != null
            ? `Order Agent: I couldn't find any order with ID ${externalId} for your account.`
            : 'Order Agent: I could not find any matching orders. Please provide your order ID (e.g. ORD-1001).',
      };
    }

    const [order] = orders;

    const reply = `Order Agent: Order ${order.externalId} is currently ${order.status} with delivery status ${order.deliveryStatus}. Total amount: ${order.totalAmount} ${order.currency}.`
      + (context.truncated ? ` (Using recent context only: ${context.summary})` : '');

    return {
      agentType: 'ORDER',
      reply,
    };
  },
};


