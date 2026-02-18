import { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chat-store';
import { useAgent } from '../../hooks/useAgent';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import StreamingMessage from './StreamingMessage';
import ComposeBar from './ComposeBar';
import ErrorRetryBanner from './ErrorRetryBanner';
import { MessageSkeleton } from '../ui/LoadingSkeleton';

export default function ChatView() {
  const messages = useChatStore(s => s.messages);
  const streaming = useChatStore(s => s.streaming);
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const isLoadingMessages = useChatStore(s => s.isLoadingMessages);
  const { activeAgent } = useAgent();
  const { drilldown } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming.currentText]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!activeSessionId && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              {activeAgent && (
                <>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, margin: '0 auto 16px',
                    background: activeAgent.isGeneral
                      ? `linear-gradient(135deg, ${activeAgent.color}, #6366f1)`
                      : `${activeAgent.color}15`,
                    color: activeAgent.isGeneral ? '#fff' : activeAgent.color,
                  }}>
                    {activeAgent.avatar}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>
                    Chat with {activeAgent.name}
                  </h2>
                  <p style={{ fontSize: 14, color: '#9999aa' }}>
                    {activeAgent.role} — Start a conversation or pick a session
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {activeSessionId && isLoadingMessages && (
          <MessageSkeleton />
        )}

        {activeSessionId && !isLoadingMessages && messages.length === 0 && !streaming.isStreaming && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 14, color: '#9999aa' }}>
              Send a message to start the conversation
            </p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onDrilldown={drilldown} />
        ))}

        {streaming.isStreaming && (streaming.currentText || streaming.activeToolCall) && (
          <StreamingMessage text={streaming.currentText} activeToolCall={streaming.activeToolCall} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error retry banner */}
      <ErrorRetryBanner />

      {/* Compose bar */}
      <ComposeBar />
    </div>
  );
}
