import type { AgentType, Message } from '@mass/db';
import { supportAgent } from './supportAgent';
import { orderAgent } from './orderAgent';
import { billingAgent } from './billingAgent';

type RouteInput = {
  userId: string;
  conversationId: string;
  latestUserMessage: Message;
};

type RouteResult = {
  agentType: AgentType;
  reply: string;
};

export const routerAgent = {
  async route(input: RouteInput): Promise<RouteResult> {
    const text = input.latestUserMessage.content.toLowerCase();

    if (text.includes('order') || text.match(/ord-\d+/i)) {
      return orderAgent.handle(input);
    }

    if (text.includes('refund') || text.includes('charge') || text.includes('invoice')) {
      return billingAgent.handle(input);
    }

    // Fallback to support
    return supportAgent.handle(input);
  },
};


