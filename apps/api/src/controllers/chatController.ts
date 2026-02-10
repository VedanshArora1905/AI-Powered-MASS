import type { Context } from 'hono';
import { chatService } from '../services/chatService';

export const chatController = {
  async createMessage(c: Context) {
    const body = await c.req.json();
    const response = await chatService.handleIncomingMessage(body);
    return c.json(response);
  },

  async listConversations(c: Context) {
    const userId = c.req.query('userId') ?? 'demo-user';
    const conversations = await chatService.listConversations({ userId });
    return c.json(conversations);
  },

  async getConversation(c: Context) {
    const id = c.req.param('id');
    const userId = c.req.query('userId') ?? 'demo-user';
    const conversation = await chatService.getConversation({ id, userId });
    return c.json(conversation);
  },

  async deleteConversation(c: Context) {
    const id = c.req.param('id');
    const userId = c.req.query('userId') ?? 'demo-user';
    await chatService.deleteConversation({ id, userId });
    return c.json({ success: true });
  },
};


