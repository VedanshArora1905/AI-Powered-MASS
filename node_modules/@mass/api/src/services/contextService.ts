import { prisma } from '@mass/db';

export type ConversationContext = {
  messages: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }[];
  truncated: boolean;
  summary?: string | null;
};

type GetContextOptions = {
  maxMessages?: number;
};

/**
 * Returns a compact view of conversation history suitable for feeding into agents.
 * Applies a simple sliding window over the last N messages and exposes a hook
 * for future summarization.
 */
export async function getConversationContext(
  conversationId: string,
  options: GetContextOptions = {},
): Promise<ConversationContext> {
  const maxMessages = options.maxMessages ?? 20;

  const total = await prisma.message.count({
    where: { conversationId },
  });

  const skip = Math.max(0, total - maxMessages);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    skip,
    take: maxMessages,
  });

  const truncated = total > maxMessages;

  const summary = truncated
    ? `Context truncated: showing last ${maxMessages} of ${total} messages.`
    : null;

  return {
    messages,
    truncated,
    summary,
  };
}


