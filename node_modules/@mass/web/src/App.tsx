import { useEffect, useState } from 'react';
import './index.css';
import {
  type Conversation,
  type Message,
  sendMessageStream,
  listConversations,
  getConversation,
} from './api/chat';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    void (async () => {
      const data = await listConversations();
      setConversations(data);
      if (data.length && !activeConversationId) {
        setActiveConversationId(data[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    void (async () => {
      const conv = await getConversation({ id: activeConversationId });
      setMessages(conv.messages);
    })();
  }, [activeConversationId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsSending(true);
    try {
      const createdAt = new Date().toISOString();

      // Optimistically add user message
      const userMessage: Message = {
        id: `temp-user-${createdAt}`,
        conversationId: activeConversationId ?? 'pending',
        role: 'USER',
        content: input,
        createdAt,
        agentType: null,
      };

      // Placeholder agent message that we'll stream into
      const agentMessage: Message = {
        id: `temp-agent-${createdAt}`,
        conversationId: activeConversationId ?? 'pending',
        role: 'AGENT',
        content: '',
        createdAt,
        agentType: null,
      };

      setMessages((prev) => [...prev, userMessage, agentMessage]);

      let latestConversationId = activeConversationId ?? null;
      let latestAgentType: Message['agentType'] = null;

      await sendMessageStream(
        {
          content: input,
          conversationId: activeConversationId ?? undefined,
        },
        {
          onToken: (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMessage.id
                  ? { ...m, content: (m.content ?? '') + chunk }
                  : m,
              ),
            );
          },
        },
      ).then((meta) => {
        latestConversationId = meta.conversationId;
        latestAgentType = meta.agentType;
      });

      if (latestConversationId) {
        setActiveConversationId(latestConversationId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMessage.id
              ? {
                  ...m,
                  conversationId: latestConversationId!,
                  agentType: latestAgentType,
                }
              : m.id === userMessage.id
              ? { ...m, conversationId: latestConversationId! }
              : m,
          ),
        );

        if (!conversations.find((c) => c.id === latestConversationId)) {
          const updated = await listConversations();
          setConversations(updated);
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === latestConversationId
                ? { ...c, updatedAt: new Date().toISOString(), title: c.title }
                : c,
            ),
          );
        }
      }
    } finally {
      setIsSending(false);
      setInput('');
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <header className="sidebar-header">
          <h1>AI-Powered MASS</h1>
          <p className="sidebar-subtitle">Multi-agent support system</p>
        </header>
        <button
          className="primary-button full-width"
          onClick={() => {
            setActiveConversationId(null);
            setMessages([]);
          }}
        >
          New conversation
        </button>
        <div className="sidebar-section">
          <h2>Conversations</h2>
          <div className="conversation-list">
            {conversations.map((c) => (
              <button
                key={c.id}
                className={
                  'conversation-item' + (c.id === activeConversationId ? ' active' : '')
                }
                onClick={() => setActiveConversationId(c.id)}
              >
                <span className="conversation-title">{c.title}</span>
                <span className="conversation-meta">
                  {new Date(c.updatedAt).toLocaleTimeString()}
                </span>
              </button>
            ))}
            {!conversations.length && (
              <p className="empty-state">No conversations yet. Start by sending a message.</p>
            )}
          </div>
        </div>
      </aside>
      <main className="chat-pane">
        <header className="chat-header">
          <div>
            <h2>
              {activeConversationId
                ? 'Conversation'
                : 'New conversation'}
            </h2>
            <p className="chat-subtitle">
              Messages are routed automatically between Router, Support, Order, and Billing
              agents.
            </p>
          </div>
        </header>
        <section className="chat-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                'message-row ' +
                (m.role === 'USER' ? 'message-user' : 'message-agent')
              }
            >
              <div className="message-bubble">
                <div className="message-meta">
                  <span className="message-role">
                    {m.role === 'USER'
                      ? 'You'
                      : m.agentType
                      ? `${m.agentType} agent`
                      : 'Agent'}
                  </span>
                  <span className="message-time">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{m.content}</div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="typing-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="typing-label">Agent is typing…</span>
            </div>
          )}
        </section>
        <footer className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Ask a question about your orders, billing, or support…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            className="primary-button"
            onClick={() => void handleSend()}
            disabled={isSending || !input.trim()}
          >
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}

export default App;
