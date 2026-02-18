import { useState } from 'react';
import { useStreamStore } from '../../stores/stream-store';
import { useUIStore } from '../../stores/ui-store';
import CreateChannelModal from './CreateChannelModal';

export default function ChannelListSection() {
  const channels = useStreamStore(s => s.channels);
  const publicChannels = useStreamStore(s => s.publicChannels);
  const isConnected = useStreamStore(s => s.isConnected);
  const joinChannel = useStreamStore(s => s.joinChannel);
  const activeView = useUIStore(s => s.activeView);
  const setActiveView = useUIStore(s => s.setActiveView);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  if (!isConnected) {
    return (
      <div style={{ padding: '8px 8px', fontSize: 12, color: '#9999aa' }}>
        Stream not connected
      </div>
    );
  }

  const handleJoin = async (channelId: string) => {
    setJoiningId(channelId);
    await joinChannel(channelId);
    setActiveView({ type: 'channel', channelId });
    setJoiningId(null);
  };

  return (
    <>
      {/* Channels user is a member of */}
      {channels.map(channel => {
        const isActive = activeView.type === 'channel' && activeView.channelId === channel.id;
        const unread = channel.state.unreadCount || 0;
        const data = channel.data as any;
        const isPrivate = !data?.isPublic;
        return (
          <button
            key={channel.id}
            onClick={() => setActiveView({ type: 'channel', channelId: channel.id! })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 10px', borderRadius: 8, border: 'none',
              background: isActive ? '#e5e5ed' : 'transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 13.5,
              color: isActive ? '#1a1a2e' : '#5a5a70',
              fontWeight: unread > 0 ? 600 : 400,
            }}
          >
            <span style={{ color: '#9999aa', fontSize: 14, fontWeight: 700 }}>
              {isPrivate ? '🔒' : '#'}
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data?.name || channel.id}
            </span>
            {unread > 0 && (
              <span style={{
                background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 600,
                borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center',
              }}>
                {unread}
              </span>
            )}
          </button>
        );
      })}

      {/* Public channels available to join */}
      {publicChannels.length > 0 && (
        <>
          <div style={{
            fontSize: 11, fontWeight: 600, color: '#9999aa', padding: '12px 10px 4px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Browse public
          </div>
          {publicChannels.map(channel => {
            const data = channel.data as any;
            const isJoining = joiningId === channel.id;
            return (
              <div
                key={channel.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '6px 10px', borderRadius: 8, fontSize: 13.5, color: '#9999aa',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700 }}>#</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data?.name || channel.id}
                </span>
                <button
                  onClick={() => handleJoin(channel.id!)}
                  disabled={isJoining}
                  style={{
                    padding: '3px 10px', borderRadius: 6, border: '1px solid #e5e5ed',
                    background: '#fff', cursor: isJoining ? 'default' : 'pointer',
                    fontSize: 11, fontWeight: 600, color: '#6366f1',
                    opacity: isJoining ? 0.6 : 1,
                  }}
                >
                  {isJoining ? '...' : 'Join'}
                </button>
              </div>
            );
          })}
        </>
      )}

      <button
        onClick={() => setShowCreate(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          padding: '6px 10px', borderRadius: 8, border: 'none',
          background: 'transparent', cursor: 'pointer',
          fontSize: 12, color: '#9999aa',
        }}
      >
        <span style={{ fontSize: 14 }}>+</span> Create Channel
      </button>

      {showCreate && <CreateChannelModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
