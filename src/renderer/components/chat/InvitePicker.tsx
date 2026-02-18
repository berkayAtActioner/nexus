import { usePeopleStore } from '../../stores/people-store';

interface Props {
  existingIds: string[];
  onSelect: (userId: string) => void;
  onClose: () => void;
}

export default function InvitePicker({ existingIds, onSelect, onClose }: Props) {
  const users = usePeopleStore(s => s.users);
  const availableUsers = users.filter(u => !existingIds.includes(u.id));

  if (availableUsers.length === 0) {
    return (
      <div
        style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          width: 220, background: '#fff', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e5e5ed',
          padding: 12, zIndex: 50,
        }}
      >
        <div style={{ fontSize: 13, color: '#9999aa', textAlign: 'center' }}>
          No users to invite
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div
        style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          width: 220, background: '#fff', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e5e5ed',
          padding: 4, zIndex: 50, maxHeight: 200, overflowY: 'auto',
        }}
      >
        {availableUsers.map(user => (
          <button
            key={user.id}
            onClick={() => onSelect(user.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 10px', borderRadius: 6, border: 'none',
              background: 'transparent', cursor: 'pointer', textAlign: 'left',
              fontSize: 13, color: '#1a1a2e',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f4f4f8')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 8,
              background: '#ededf7', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: '#6366f1', overflow: 'hidden', flexShrink: 0,
            }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} style={{ width: 24, height: 24, borderRadius: 8 }} />
              ) : (
                user.name[0].toUpperCase()
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: '#9999aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
