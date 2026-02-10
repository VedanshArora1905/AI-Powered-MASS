import type { Context } from 'hono';
import { agentService } from '../services/agentService';

export const agentController = {
  async listAgents(c: Context) {
    const agents = agentService.listAgents();
    return c.json(agents);
  },

  async getAgentCapabilities(c: Context) {
    const type = c.req.param('type');
    const capabilities = agentService.getAgentCapabilities(type);
    return c.json(capabilities);
  },
};


