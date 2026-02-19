import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';

function UserInitials({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      title={name}
      style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #6366f1, #818cf8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden',
        border: '2px solid #e5e5ed',
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
      ) : (
        initials || '?'
      )}
    </div>
  );
}

export default function ActivityBar() {
  const sidebarSection = useUIStore(s => s.sidebarSection);
  const activeView = useUIStore(s => s.activeView);
  const pinnedApps = useUIStore(s => s.pinnedApps);
  const setActiveView = useUIStore(s => s.setActiveView);
  const setSidebarSection = useUIStore(s => s.setSidebarSection);
  const currentUser = useAuthStore(s => s.currentUser);

  const navItems = [
    { id: 'channels' as const, icon: '#', label: 'Channels', viewType: 'channel' },
    { id: 'people' as const, icon: '👤', label: 'People', viewType: 'human-dm' },
    { id: 'agents' as const, icon: '◈', label: 'AI Agents', viewType: 'agent-dm' },
  ];

  return (
    <div
      style={{
        width: 56, background: '#f0f0f5', display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 12, gap: 4, borderRight: '1px solid #e5e5ed', flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8,
      }}>
        N
      </div>

      {/* Nav items */}
      {navItems.map(item => {
        const isActive = sidebarSection === item.id;
        return (
          <button
            key={item.id}
            title={item.label}
            onClick={() => {
              setSidebarSection(item.id);
              if (item.id === 'agents' && activeView.type !== 'agent-dm') {
                setActiveView({ type: 'agent-dm', agentId: 'nexus' });
              }
            }}
            style={{
              width: 40, height: 40, borderRadius: 10, border: 'none',
              background: isActive ? '#e5e5ed' : 'transparent',
              color: isActive ? '#1a1a2e' : '#9999aa',
              fontSize: item.id === 'channels' ? 16 : 18, cursor: 'pointer',
              fontWeight: item.id === 'channels' ? 700 : 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {item.icon}
          </button>
        );
      })}

      {/* Divider + Pinned Apps */}
      {pinnedApps.length > 0 && (
        <>
          <div style={{
            width: 24, height: 1, background: '#e5e5ed', margin: '4px 0',
          }} />
          {pinnedApps.map(app => {
            const isActive = activeView.type === 'pinned-app' && activeView.appId === app.id;
            return (
              <button
                key={app.id}
                title={app.title}
                onClick={() => setActiveView({ type: 'pinned-app', appId: app.id })}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: 'none',
                  background: isActive ? (app.color + '20') : 'transparent',
                  color: isActive ? app.color : '#9999aa',
                  fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {app.icon}
              </button>
            );
          })}
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Current user with popover */}
      {currentUser && (
        <UserMenu currentUser={currentUser} />
      )}
    </div>
  );
}

function UserMenu({ currentUser }: { currentUser: { name: string; email: string; avatar_url: string | null } }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: 'relative', paddingBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <UserInitials name={currentUser.name} avatarUrl={currentUser.avatar_url} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 48, left: 0,
          background: '#fff', borderRadius: 10, border: '1px solid #e5e5ed',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '8px 0',
          minWidth: 180, zIndex: 1000,
        }}>
          {/* User info */}
          <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid #e5e5ed' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: 11, color: '#9999aa', marginTop: 2 }}>
              {currentUser.email}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              setOpen(false);
              useAuthStore.getState().logout();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 14px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, color: '#ef4444',
              fontFamily: 'inherit', textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
