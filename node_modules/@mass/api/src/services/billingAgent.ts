import type { AgentType } from '@mass/db';
import { prisma } from '@mass/db';
import type { Message } from '@mass/db';
import { getConversationContext } from './contextService';

type AgentHandleInput = {
  userId: string;
  conversationId: string;
  latestUserMessage: Message;
};

export const billingAgent = {
  async handle(input: AgentHandleInput): Promise<{ agentType: AgentType; reply: string }> {
    const text = input.latestUserMessage.content;

    const context = await getConversationContext(input.conversationId, {
      maxMessages: 10,
    });

    const externalIdMatch = text.match(/ORD-\d+/i);
    const externalId = externalIdMatch?.[0].toUpperCase();

    const orders = await prisma.order.findMany({
      where: {
        userId: input.userId,
        ...(externalId ? { externalId } : {}),
      },
      include: {
        payments: true,
      },
    });

    if (!orders.length) {
      return {
        agentType: 'BILLING',
        reply:
          externalId != null
            ? `Billing Agent: I couldn't find any billing records for order ${externalId}.`
            : 'Billing Agent: I could not locate billing information. Please include your order ID (e.g. ORD-1002).',
      };
    }

    const [order] = orders;
    const latestPayment = order.payments[0];

    if (!latestPayment) {
      return {
        agentType: 'BILLING',
        reply: `Billing Agent: I found order ${order.externalId}, but no payments are associated with it yet.`,
      };
    }

    const reply = `Billing Agent: For order ${order.externalId}, the latest payment of ${latestPayment.amount} ${latestPayment.currency} is ${latestPayment.status} with refund status ${latestPayment.refundStatus}.`
      + (context.truncated ? ` (Using recent context only: ${context.summary})` : '');

    return {
      agentType: 'BILLING',
      reply,
    };
  },
};


