import { Hono } from 'hono';
import { chatController } from '../controllers/chatController';
import { rateLimit } from '../middleware/rateLimit';

const chatRoute = new Hono();

const chatRateLimit = rateLimit({
  tokensPerInterval: 30,
  intervalMs: 60_000,
});

chatRoute.post('/messages', chatRateLimit, (c) => chatController.createMessage(c));
chatRoute.post(
  '/messages/stream',
  chatRateLimit,
  (c) => chatController.createMessageStream(c),
);
chatRoute.get('/conversations', (c) => chatController.listConversations(c));
chatRoute.get('/conversations/:id', (c) => chatController.getConversation(c));
chatRoute.delete('/conversations/:id', (c) => chatController.deleteConversation(c));

export { chatRoute };


