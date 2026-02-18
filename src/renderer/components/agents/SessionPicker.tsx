import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chat-store';
import { useAgent } from '../../hooks/useAgent';

export default function SessionPicker() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sessions = useChatStore(s => s.sessions);
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const setActiveSession = useChatStore(s => s.setActiveSession);
  const createSession = useChatStore(s => s.createSession);
  const { activeAgent } = useAgent();

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewSession = async () => {
    if (!activeAgent) return;
    await createSession(activeAgent.id);
    setOpen(false);
  };

  const handleSelectSession = async (sessionId: string) => {
    await setActiveSession(sessionId);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '6px 12px', borderRadius: 8,
          border: '1px solid #e5e5ed', background: open ? '#f0f0f5' : '#f4f4f8',
          color: '#6b6b80', cursor: 'pointer', fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ color: activeAgent?.color || '#8b5cf6' }}>●</span>
        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeSession?.title || 'No session'}
        </span>
        <span style={{ fontSize: 10, marginLeft: 4 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: '#fff', border: '1px solid #e5e5ed', borderRadius: 12,
          padding: 6, minWidth: 240, zIndex: 50,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}>
          <button
            onClick={handleNewSession}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px dashed #e5e5ed', background: 'transparent',
              cursor: 'pointer', fontSize: 12, color: activeAgent?.color || '#8b5cf6',
              marginBottom: 4, textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            + New Session
          </button>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelectSession(s.id)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontSize: 12, textAlign: 'left',
                display: 'flex', justifyContent: 'space-between',
                background: s.id === activeSessionId ? '#f4f4f8' : 'transparent',
                color: s.id === activeSessionId ? '#1a1a2e' : '#6b6b80',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
              <span style={{ color: '#9999aa', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                {new Date(s.updated_at).toLocaleDateString()}
              </span>
            </button>
          ))}
          {sessions.length === 0 && (
            <div style={{ padding: '8px 10px', fontSize: 11, color: '#9999aa', textAlign: 'center' }}>
              No sessions yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
