import { useState, useEffect, useRef } from 'react';
import { Channel as StreamChannel } from 'stream-chat';
import { usePeopleStore } from '../../stores/people-store';
import { useAuthStore } from '../../stores/auth-store';

interface Props {
  channel: StreamChannel;
  onClose: () => void;
}

export default function ChannelMembersPanel({ channel, onClose }: Props) {
  const users = usePeopleStore(s => s.users);
  const currentUser = useAuthStore(s => s.currentUser);
  const [members, setMembers] = useState<{ id: string; name: string; avatar?: string; role?: string }[]>([]);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load members from channel state
  useEffect(() => {
    const memberMap = channel.state?.members || {};
    const memberList = Object.values(memberMap).map((m: any) => ({
      id: m.user_id || m.user?.id || '',
      name: m.user?.name || m.user_id || 'Unknown',
      avatar: m.user?.image || undefined,
      role: m.role || (m.user_id === (channel.data as any)?.created_by_id ? 'owner' : 'member'),
    }));
    setMembers(memberList);
  }, [channel, channel.state?.members]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const memberIds = new Set(members.map(m => m.id));
  const nonMembers = users.filter(u => !memberIds.has(u.id));
  const filtered = search
    ? nonMembers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : nonMembers;

  const handleRemove = async (userId: string) => {
    if (userId === currentUser?.id) return; // can't remove self easily
    setRemoving(userId);
    try {
      await channel.removeMembers([userId]);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err) {
      console.error('Remove member error:', err);
    }
    setRemoving(null);
  };

  const handleAdd = async (userId: string) => {
    setAdding(userId);
    try {
      await channel.addMembers([userId]);
      const user = users.find(u => u.id === userId);
      setMembers(prev => [...prev, {
        id: userId,
        name: user?.name || userId,
        avatar: user?.avatar_url || undefined,
        role: 'member',
      }]);
      setSearch('');
      setShowAddSearch(false);
    } catch (err) {
      console.error('Add member error:', err);
    }
    setAdding(null);
  };

  function Initials({ name, avatar }: { name: string; avatar?: string }) {
    const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    return (
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: avatar ? 'transparent' : '#ededf7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color: '#6366f1', overflow: 'hidden',
      }}>
        {avatar ? (
          <img src={avatar} style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
        ) : (
          initials || '?'
        )}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', top: 52, right: 20,
        width: 300, background: '#fff', borderRadius: 12,
        border: '1px solid #e5e5ed', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        zIndex: 100, maxHeight: 420, display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px', borderBottom: '1px solid #e5e5ed',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
          Members ({members.length})
        </span>
        <button
          onClick={() => setShowAddSearch(!showAddSearch)}
          style={{
            padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e5ed',
            background: showAddSearch ? '#ededf7' : '#fff', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, color: '#6366f1',
          }}
        >
          + Add
        </button>
      </div>

      {/* Add member search */}
      {showAddSearch && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e5ed' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people..."
            autoFocus
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 8,
              border: '1px solid #e5e5ed', fontSize: 13, color: '#1a1a2e',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = '#6366f1')}
            onBlur={e => (e.target.style.borderColor = '#e5e5ed')}
          />
          {filtered.length > 0 ? (
            <div style={{ maxHeight: 120, overflowY: 'auto', marginTop: 6 }}>
              {filtered.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleAdd(user.id)}
                  disabled={adding === user.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '6px 4px', borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    opacity: adding === user.id ? 0.5 : 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8f8fa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Initials name={user.name} avatar={user.avatar_url || undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: '#9999aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#9999aa', padding: '8px 0' }}>
              {nonMembers.length === 0 ? 'All users are members' : 'No matches'}
            </div>
          )}
        </div>
      )}

      {/* Member list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {members.map(member => {
          const isMe = member.id === currentUser?.id;
          return (
            <div
              key={member.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px',
              }}
            >
              <Initials name={member.name} avatar={member.avatar} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>
                  {member.name}
                </span>
                {isMe && (
                  <span style={{ fontSize: 11, color: '#9999aa', marginLeft: 4 }}>you</span>
                )}
              </div>
              {!isMe && (
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={removing === member.id}
                  title="Remove member"
                  style={{
                    width: 22, height: 22, borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 13, color: '#9999aa', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: removing === member.id ? 0.4 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9999aa'; }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
