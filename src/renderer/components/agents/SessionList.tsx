import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chat-store';
import { useAgent } from '../../hooks/useAgent';
import { useToastStore } from '../../stores/toast-store';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function SessionList() {
  const sessions = useChatStore(s => s.sessions);
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const isLoadingSessions = useChatStore(s => s.isLoadingSessions);
  const setActiveSession = useChatStore(s => s.setActiveSession);
  const createSession = useChatStore(s => s.createSession);
  const deleteSession = useChatStore(s => s.deleteSession);
  const updateSessionTitle = useChatStore(s => s.updateSessionTitle);
  const { activeAgent } = useAgent();
  const addToast = useToastStore(s => s.addToast);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleNewSession = async () => {
    if (!activeAgent) return;
    await createSession(activeAgent.id);
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    await deleteSession(sessionId);
    addToast('Session deleted', 'success');
  };

  const startEditing = (sessionId: string, currentTitle: string) => {
    setEditingId(sessionId);
    setEditTitle(currentTitle);
  };

  const commitEdit = async () => {
    if (editingId && editTitle.trim()) {
      await updateSessionTitle(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  if (isLoadingSessions) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: 40, borderRadius: 8, background: '#ededf3',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* New Chat button */}
      <button
        onClick={handleNewSession}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          border: '1px dashed #d0d0dd', background: 'transparent',
          cursor: 'pointer', fontSize: 12, color: activeAgent?.color || '#8b5cf6',
          textAlign: 'left', fontFamily: 'inherit', marginBottom: 4,
        }}
      >
        + New Chat
      </button>

      {sessions.length === 0 && (
        <div style={{ padding: '12px 10px', fontSize: 12, color: '#9999aa', textAlign: 'center' }}>
          No conversations yet
        </div>
      )}

      {sessions.map(session => (
        <div
          key={session.id}
          onClick={() => setActiveSession(session.id)}
          onDoubleClick={() => startEditing(session.id, session.title)}
          onMouseEnter={() => setHoveredId(session.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            padding: '7px 10px',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: session.id === activeSessionId ? '#e5e5ed' : hoveredId === session.id ? '#ededf3' : 'transparent',
            transition: 'background 0.15s',
          }}
        >
          {editingId === session.id ? (
            <input
              ref={editInputRef}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              onClick={e => e.stopPropagation()}
              style={{
                flex: 1, fontSize: 12, padding: '2px 4px', borderRadius: 4,
                border: '1px solid #d0d0dd', outline: 'none', fontFamily: 'inherit',
                background: '#fff',
              }}
            />
          ) : (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5,
                  color: session.id === activeSessionId ? '#1a1a2e' : '#6b6b80',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {session.title}
                </div>
                <div style={{ fontSize: 10, color: '#9999aa', marginTop: 1 }}>
                  {formatRelativeTime(session.updated_at)}
                </div>
              </div>
              {hoveredId === session.id && (
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9999aa', fontSize: 12, padding: '2px 4px',
                    borderRadius: 4, lineHeight: 1, flexShrink: 0,
                  }}
                  title="Delete session"
                >
                  ✕
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
