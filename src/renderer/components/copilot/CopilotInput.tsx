import { useState, useRef, KeyboardEvent } from 'react';

interface Props {
  onSend: (content: string) => void;
  isStreaming: boolean;
  placeholder: string;
}

export default function CopilotInput({ onSend, isStreaming, placeholder }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      borderTop: '1px solid #e5e5ed', padding: '10px 14px',
      background: '#fff', flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        background: '#f8f8fa', borderRadius: 10, border: '1px solid #e5e5ed',
        padding: '8px 12px',
      }}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          rows={1}
          style={{
            flex: 1, border: 'none', background: 'transparent', resize: 'none',
            outline: 'none', fontSize: 13, color: '#1a1a2e', lineHeight: 1.4,
            minHeight: 20, maxHeight: 80, fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          style={{
            width: 28, height: 28, borderRadius: 7, border: 'none', flexShrink: 0,
            background: value.trim() && !isStreaming ? '#6366f1' : '#e5e5ed',
            color: value.trim() && !isStreaming ? '#fff' : '#9999aa',
            cursor: value.trim() && !isStreaming ? 'pointer' : 'default',
            fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
