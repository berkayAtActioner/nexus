import { useEffect, useRef } from 'react';
import { CopilotMessage } from '../../../shared/types';
import { useUIStore } from '../../stores/ui-store';

interface Props {
  messages: CopilotMessage[];
  isStreaming: boolean;
  currentText: string;
  agentName: string;
  agentAvatar: string;
  agentColor: string;
  onPostToChannel: (content: string) => void;
}

export default function CopilotMessageList({ messages, isStreaming, currentText, agentName, agentAvatar, agentColor, onPostToChannel }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeView = useUIStore(s => s.activeView);
  const canPost = activeView.type === 'channel';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, currentText]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{agentAvatar}</div>
          <div style={{ fontSize: 13, color: '#9999aa', lineHeight: 1.5 }}>
            Ask {agentName} about this conversation.
            <br />
            Summarize, analyze, or draft messages.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {messages.map(msg => (
        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: msg.role === 'assistant' ? agentColor : '#5a5a70' }}>
            {msg.role === 'assistant' ? agentName : 'You'}
          </div>
          <div style={{
            padding: '8px 12px', borderRadius: 10, fontSize: 13,
            lineHeight: 1.5, whiteSpace: 'pre-wrap',
            background: msg.role === 'assistant' ? '#f8f8fa' : '#ededf7',
            border: `1px solid ${msg.role === 'assistant' ? '#e5e5ed' : '#dddde8'}`,
            color: '#1a1a2e',
          }}>
            {msg.content}
          </div>
          {/* Post to channel button for assistant messages */}
          {msg.role === 'assistant' && canPost && (
            <button
              onClick={() => onPostToChannel(msg.content)}
              style={{
                alignSelf: 'flex-start', padding: '3px 10px', borderRadius: 6,
                border: '1px solid #e5e5ed', background: '#fff', cursor: 'pointer',
                fontSize: 11, color: '#9999aa',
              }}
              onMouseOver={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#9999aa'; e.currentTarget.style.borderColor = '#e5e5ed'; }}
            >
              Post to channel
            </button>
          )}
        </div>
      ))}

      {/* Streaming message */}
      {isStreaming && currentText && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: agentColor }}>
            {agentName}
          </div>
          <div style={{
            padding: '8px 12px', borderRadius: 10, fontSize: 13,
            lineHeight: 1.5, whiteSpace: 'pre-wrap',
            background: '#f8f8fa', border: '1px solid #e5e5ed', color: '#1a1a2e',
          }}>
            {currentText}
            <span style={{ opacity: 0.5 }}>▌</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
