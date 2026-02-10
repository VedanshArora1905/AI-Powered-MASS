import { Hono } from 'hono';
import { agentController } from '../controllers/agentController';

const agentsRoute = new Hono();

agentsRoute.get('/', (c) => agentController.listAgents(c));
agentsRoute.get('/:type/capabilities', (c) => agentController.getAgentCapabilities(c));

export { agentsRoute };


