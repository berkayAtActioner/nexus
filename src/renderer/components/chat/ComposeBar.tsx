import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAgent } from '../../hooks/useAgent';

export default function ComposeBar() {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, streaming } = useChat();
  const { activeAgent } = useAgent();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming.isStreaming) return;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #e5e5ed', flexShrink: 0 }}>
      <div style={{
        background: '#f4f4f8', borderRadius: 12,
        border: '1px solid #e5e5ed', padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activeAgent?.name || 'agent'}...`}
          disabled={streaming.isStreaming}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#1a1a2e', fontSize: 13.5, fontFamily: 'inherit',
            opacity: streaming.isStreaming ? 0.5 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming.isStreaming}
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: activeAgent?.color || '#8b5cf6',
            color: '#fff', cursor: (!input.trim() || streaming.isStreaming) ? 'not-allowed' : 'pointer',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!input.trim() || streaming.isStreaming) ? 0.4 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
