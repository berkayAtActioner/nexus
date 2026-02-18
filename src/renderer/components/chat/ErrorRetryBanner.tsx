import { useChatStore } from '../../stores/chat-store';
import { useChat } from '../../hooks/useChat';

export default function ErrorRetryBanner() {
  const lastFailedMessage = useChatStore(s => s.lastFailedMessage);
  const setLastFailedMessage = useChatStore(s => s.setLastFailedMessage);
  const { sendMessage } = useChat();

  if (!lastFailedMessage) return null;

  const handleRetry = () => {
    const content = lastFailedMessage.content;
    setLastFailedMessage(null);
    sendMessage(content);
  };

  return (
    <div style={{
      margin: '0 24px', padding: '10px 14px', borderRadius: 10,
      background: '#fef2f2', border: '1px solid #fecaca',
      display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
    }}>
      <span style={{ color: '#ef4444', fontWeight: 500 }}>Message failed to send</span>
      <div style={{ flex: 1 }} />
      <button
        onClick={() => setLastFailedMessage(null)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9999aa', fontSize: 12, fontFamily: 'inherit',
        }}
      >
        Dismiss
      </button>
      <button
        onClick={handleRetry}
        style={{
          padding: '4px 12px', borderRadius: 6, border: 'none',
          background: '#ef4444', color: '#fff', cursor: 'pointer',
          fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
        }}
      >
        Retry
      </button>
    </div>
  );
}
