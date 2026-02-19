import { useState } from 'react';
import { useStreamStore } from '../../stores/stream-store';
import { usePeopleStore } from '../../stores/people-store';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';

interface Props {
  onClose: () => void;
}

export default function CreateChannelModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const createChannel = useStreamStore(s => s.createChannel);
  const users = usePeopleStore(s => s.users);
  const currentUser = useAuthStore(s => s.currentUser);
  const setActiveView = useUIStore(s => s.setActiveView);

  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const result = await createChannel(name.trim(), selectedMembers, isPublic);
    setCreating(false);
    if (result?.id) {
      setActiveView({ type: 'channel', channelId: result.id });
    }
    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div
        style={{
          width: 420, background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 24,
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a2e', margin: '0 0 20px' }}>
          Create Channel
        </h2>

        <label style={{ fontSize: 12, fontWeight: 600, color: '#9999aa', display: 'block', marginBottom: 6 }}>
          Channel Name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. engineering"
          autoFocus
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid #e5e5ed', fontSize: 14, color: '#1a1a2e',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#e5e5ed')}
        />

        {/* Public / Private toggle */}
        <label style={{ fontSize: 12, fontWeight: 600, color: '#9999aa', display: 'block', margin: '16px 0 8px' }}>
          Visibility
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsPublic(true)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              border: isPublic ? '2px solid #6366f1' : '1px solid #e5e5ed',
              background: isPublic ? '#ededf7' : '#fff',
              fontSize: 13, fontWeight: 500, color: isPublic ? '#6366f1' : '#5a5a70',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 16 }}>#</span>
            <span>Public</span>
            <span style={{ fontSize: 11, color: '#9999aa', fontWeight: 400 }}>Anyone can find & join</span>
          </button>
          <button
            onClick={() => setIsPublic(false)}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              border: !isPublic ? '2px solid #6366f1' : '1px solid #e5e5ed',
              background: !isPublic ? '#ededf7' : '#fff',
              fontSize: 13, fontWeight: 500, color: !isPublic ? '#6366f1' : '#5a5a70',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 16 }}>🔒</span>
            <span>Private</span>
            <span style={{ fontSize: 11, color: '#9999aa', fontWeight: 400 }}>Invite-only</span>
          </button>
        </div>

        {/* Member selection — always shown for private, optional for public */}
        {!isPublic && otherUsers.length > 0 && (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9999aa', display: 'block', margin: '16px 0 6px' }}>
              Add Members
            </label>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {otherUsers.map(user => (
                <label
                  key={user.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                    background: selectedMembers.includes(user.id) ? '#ededf7' : 'transparent',
                    fontSize: 13.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user.id)}
                    onChange={() => toggleMember(user.id)}
                  />
                  <span>{user.name}</span>
                  <span style={{ color: '#9999aa', fontSize: 12 }}>{user.email}</span>
                </label>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e5ed',
              background: '#fff', cursor: 'pointer', fontSize: 13, color: '#5a5a70',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: name.trim() ? '#6366f1' : '#e5e5ed',
              color: name.trim() ? '#fff' : '#9999aa',
              cursor: name.trim() ? 'pointer' : 'default',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
