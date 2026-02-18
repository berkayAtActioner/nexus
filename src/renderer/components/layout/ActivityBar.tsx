import { useUIStore } from '../../stores/ui-store';

export default function ActivityBar() {
  const sidebarSection = useUIStore(s => s.sidebarSection);
  const activeView = useUIStore(s => s.activeView);
  const pinnedApps = useUIStore(s => s.pinnedApps);
  const setActiveView = useUIStore(s => s.setActiveView);
  const setSidebarSection = useUIStore(s => s.setSidebarSection);

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
    </div>
  );
}
