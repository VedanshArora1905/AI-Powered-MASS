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

export type AgentInfo = {
  type: AgentType | 'router';
  name: string;
  description: string;
  tools: string[];
};

type StreamEvent =
  | { type: 'meta'; conversationId: string; agentType: AgentType }
  | { type: 'delta'; delta: string };

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

export async function listAgents(): Promise<AgentInfo[]> {
  const res = await fetch(`${API_BASE}/api/agents`);
  if (!res.ok) {
    throw new Error('Failed to fetch agents');
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

export async function sendMessageStream(
  input: {
    content: string;
    conversationId?: string;
    userId?: string;
  },
  opts?: { onToken?: (chunk: string) => void },
): Promise<{ conversationId: string; agentType: AgentType }> {
  const res = await fetch(`${API_BASE}/api/chat/messages/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.body) {
    throw new Error('Failed to send streaming message');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let conversationId: string | null = null;
  let agentType: AgentType | null = null;

  // Read NDJSON stream line by line
  // Each line is a JSON-encoded StreamEvent
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    let newlineIndex: number;

    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;

      const event = JSON.parse(line) as StreamEvent;
      if (event.type === 'meta') {
        conversationId = event.conversationId;
        agentType = event.agentType;
      } else if (event.type === 'delta') {
        opts?.onToken?.(event.delta);
      }
    }
  }

  if (!conversationId || !agentType) {
    throw new Error('Streaming response missing metadata');
  }

  return { conversationId, agentType };
}


