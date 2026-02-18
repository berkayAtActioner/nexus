import { usePeopleStore } from '../../stores/people-store';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';

export default function PeopleListSection() {
  const users = usePeopleStore(s => s.users);
  const currentUser = useAuthStore(s => s.currentUser);
  const activeView = useUIStore(s => s.activeView);
  const setActiveView = useUIStore(s => s.setActiveView);

  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  if (otherUsers.length === 0) {
    return (
      <div style={{ padding: '8px 8px', fontSize: 12, color: '#9999aa' }}>
        No other users yet
      </div>
    );
  }

  return (
    <>
      {otherUsers.map(user => {
        const isActive = activeView.type === 'human-dm' && activeView.userId === user.id;
        return (
          <button
            key={user.id}
            onClick={() => setActiveView({ type: 'human-dm', userId: user.id })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: isActive ? '#e5e5ed' : 'transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 13.5,
              color: isActive ? '#1a1a2e' : '#5a5a70',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              background: '#ededf7', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: '#6366f1', overflow: 'hidden',
            }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} style={{ width: 24, height: 24, borderRadius: 8 }} />
              ) : (
                user.name[0].toUpperCase()
              )}
            </div>

            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </span>

            {/* Online indicator */}
            {user.online && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            )}
          </button>
        );
      })}
    </>
  );
}
