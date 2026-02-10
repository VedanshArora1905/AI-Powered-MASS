import type { AgentType } from '@mass/db';

const agents: Array<{
  type: AgentType | 'router';
  name: string;
  description: string;
  tools: string[];
}> = [
  {
    type: 'router',
    name: 'Router Agent',
    description: 'Routes incoming queries to the most appropriate sub-agent.',
    tools: ['intent-classification'],
  },
  {
    type: 'SUPPORT',
    name: 'Support Agent',
    description: 'Handles general support inquiries, FAQs, and troubleshooting.',
    tools: ['conversation-history'],
  },
  {
    type: 'ORDER',
    name: 'Order Agent',
    description: 'Handles order status, tracking, modifications, and cancellations.',
    tools: ['fetch-order-details', 'check-delivery-status'],
  },
  {
    type: 'BILLING',
    name: 'Billing Agent',
    description: 'Handles payment issues, refunds, invoices, and subscriptions.',
    tools: ['get-invoice-details', 'check-refund-status'],
  },
];

export const agentService = {
  listAgents() {
    return agents;
  },

  getAgentCapabilities(type: string) {
    return agents.find((a) => a.type.toString().toLowerCase() === type.toLowerCase());
  },
};


