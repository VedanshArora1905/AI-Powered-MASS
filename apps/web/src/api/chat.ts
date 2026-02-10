const API_BASE = 'http://localhost:3001';

export type AgentType = 'ROUTER' | 'SUPPORT' | 'ORDER' | 'BILLING';

export type Message = {
  id: string;
  conversationId: string;
  role: 'USER' | 'AGENT' | 'SYSTEM';
  content: string;
  agentType?: AgentType | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatResponse = {
  conversationId: string;
  messages: Message[];
  agentType: AgentType;
};

export async function sendMessage(input: {
  content: string;
  conversationId?: string;
  userId?: string;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error('Failed to send message');
  }

  return res.json();
}

export async function listConversations(userId?: string): Promise<Conversation[]> {
  const url = new URL(`${API_BASE}/api/chat/conversations`);
  if (userId) url.searchParams.set('userId', userId);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch conversations');
  }
  return res.json();
}

export async function getConversation(params: {
  id: string;
  userId?: string;
}): Promise<Conversation & { messages: Message[] }> {
  const url = new URL(`${API_BASE}/api/chat/conversations/${params.id}`);
  if (params.userId) url.searchParams.set('userId', params.userId);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch conversation');
  }
  return res.json();
}


