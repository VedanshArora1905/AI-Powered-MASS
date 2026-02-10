import { Hono } from 'hono';
import { chatController } from '../controllers/chatController';

const chatRoute = new Hono();

chatRoute.post('/messages', (c) => chatController.createMessage(c));
chatRoute.get('/conversations', (c) => chatController.listConversations(c));
chatRoute.get('/conversations/:id', (c) => chatController.getConversation(c));
chatRoute.delete('/conversations/:id', (c) => chatController.deleteConversation(c));

export { chatRoute };


