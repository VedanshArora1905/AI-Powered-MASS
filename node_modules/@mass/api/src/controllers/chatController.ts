import type { Context } from 'hono';
import { chatService } from '../services/chatService';

export const chatController = {
  async createMessage(c: Context) {
    const body = await c.req.json();
    const response = await chatService.handleIncomingMessage(body);
    return c.json(response);
  },

  async listConversations(c: Context) {
    const userId = c.req.query('userId') ?? undefined;
    const conversations = await chatService.listConversations({ userId });
    return c.json(conversations);
  },

  async getConversation(c: Context) {
    const id = c.req.param('id');
    const userId = c.req.query('userId') ?? undefined;
    const conversation = await chatService.getConversation({ id, userId });
    return c.json(conversation);
  },

  async deleteConversation(c: Context) {
    const id = c.req.param('id');
    const userId = c.req.query('userId') ?? undefined;
    await chatService.deleteConversation({ id, userId });
    return c.json({ success: true });
  },

  async createMessageStream(c: Context) {
    const body = await c.req.json();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of chatService.handleIncomingMessageStream(body)) {
            controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
          }
        } catch (err) {
          console.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
      },
    });
  },
};


