import { useState, useEffect } from 'react';
import { useAgent } from '../../hooks/useAgent';
import { useMcpStore } from '../../stores/mcp-store';
import { useUIStore } from '../../stores/ui-store';
import { useStreamStore } from '../../stores/stream-store';
import { usePeopleStore } from '../../stores/people-store';
import { useChatStore } from '../../stores/chat-store';
import { useMultiUserSession } from '../../hooks/useMultiUserSession';
import AgentAvatar from '../agents/AgentAvatar';
import SessionPicker from '../agents/SessionPicker';
import ParticipantAvatars from '../chat/ParticipantAvatars';
import McpServerPicker from '../agents/McpServerPicker';

const statusColors: Record<string, string> = {
  connected: '#22c55e',
  connecting: '#f59e0b',
  error: '#ef4444',
  disconnected: '#9999aa',
};

export default function Header() {
  const activeView = useUIStore(s => s.activeView);
  const openSettings = useUIStore(s => s.openSettings);
  const openCopilot = useUIStore(s => s.openCopilot);
  const copilotOpen = useUIStore(s => s.copilotOpen);
  const closeCopilot = useUIStore(s => s.closeCopilot);
  const { activeAgent } = useAgent();
  const statuses = useMcpStore(s => s.statuses);
  const agentBindings = useMcpStore(s => s.agentBindings);
  const loadAgentBindings = useMcpStore(s => s.loadAgentBindings);
  const removeAgentBinding = useMcpStore(s => s.removeAgentBinding);
  const getEffectiveServers = useMcpStore(s => s.getEffectiveServers);
  const channels = useStreamStore(s => s.channels);
  const users = usePeopleStore(s => s.users);
  const activeSessionId = useChatStore(s => s.activeSessionId);
  const { participants, inviteUser, removeUser } = useMultiUserSession(activeSessionId);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load agent bindings when agent changes
  useEffect(() => {
    if (activeAgent?.id) {
      loadAgentBindings(activeAgent.id);
    }
  }, [activeAgent?.id]);

  // Agent DM header
  if (activeView.type === 'agent-dm') {
    if (!activeAgent) return null;
    const defaultServerIds = activeAgent.mcpServers || [];
    const effectiveServerIds = getEffectiveServers(activeAgent.id, defaultServerIds);
    const userBindings = agentBindings[activeAgent.id] || [];
    const effectiveStatuses = statuses.filter(s => effectiveServerIds.includes(s.id));

    return (
      <div style={{
        height: 52, borderBottom: '1px solid #e5e5ed', display: 'flex',
        alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, background: '#fff',
      }}>
        <AgentAvatar agent={activeAgent} size={30} />
        <div>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{activeAgent.name}</span>
          <span style={{ color: '#9999aa', fontSize: 12, marginLeft: 8 }}>{activeAgent.role}</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 8, alignItems: 'center', position: 'relative' }}>
          {effectiveStatuses.map(s => {
            const isUserAdded = userBindings.includes(s.id);
            return (
              <div
                key={s.id}
                title={s.error || `${s.status}${s.toolCount ? ` (${s.toolCount} tools)` : ''}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 6,
                  background: '#f4f4f8', border: '1px solid #e5e5ed',
                  fontSize: 11.5, color: '#5a5a70',
                }}
              >
                <span style={{ fontSize: 12 }}>{s.icon}</span>
                <span>{s.name}</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[s.status] || '#9999aa' }} />
                {isUserAdded && (
                  <button
                    onClick={() => removeAgentBinding(activeAgent.id, s.id)}
                    title="Remove server"
                    style={{
                      marginLeft: 2, border: 'none', background: 'transparent',
                      cursor: 'pointer', fontSize: 11, color: '#9999aa', padding: 0,
                      lineHeight: 1, display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9999aa')}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Add MCP server button */}
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            title="Add MCP server"
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: '1px dashed #d0d0dd', background: 'transparent',
              cursor: 'pointer', fontSize: 14, color: '#9999aa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d0d0dd'; e.currentTarget.style.color = '#9999aa'; }}
          >
            +
          </button>

          {pickerOpen && (
            <McpServerPicker
              agentId={activeAgent.id}
              boundServerIds={effectiveServerIds}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>

        {/* Multi-user participant avatars */}
        {activeSessionId && (
          <div style={{ marginLeft: 8 }}>
            <ParticipantAvatars
              participants={participants}
              onInvite={inviteUser}
              onRemove={removeUser}
            />
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Copilot toggle */}
        <button
          onClick={() => copilotOpen ? closeCopilot() : openCopilot(activeAgent.id)}
          title="AI Copilot"
          style={{
            padding: '5px 12px', borderRadius: 8,
            border: copilotOpen ? '1px solid #6366f1' : '1px solid #e5e5ed',
            background: copilotOpen ? '#ededf7' : 'transparent',
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            color: copilotOpen ? '#6366f1' : '#9999aa',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          ✦ Copilot
        </button>

        <button
          onClick={openSettings}
          title="Settings (⌘,)"
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9999aa',
          }}
        >
          ⚙
        </button>
        <SessionPicker />
      </div>
    );
  }

  // Channel header
  if (activeView.type === 'channel') {
    const channel = channels.find(c => c.id === activeView.channelId);
    const channelData = channel?.data as any;
    const channelName = channelData?.name || activeView.channelId;
    const isPrivate = !channelData?.isPublic;
    const memberCount = Object.keys(channel?.state?.members || {}).length;

    return (
      <div style={{
        height: 52, borderBottom: '1px solid #e5e5ed', display: 'flex',
        alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, background: '#fff',
      }}>
        <span style={{ fontSize: isPrivate ? 16 : 18, fontWeight: 700, color: '#9999aa' }}>
          {isPrivate ? '🔒' : '#'}
        </span>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{channelName}</span>
          <span style={{ color: '#9999aa', fontSize: 12, marginLeft: 8 }}>
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Copilot toggle */}
        <button
          onClick={() => copilotOpen ? closeCopilot() : openCopilot('nexus')}
          title="AI Copilot"
          style={{
            padding: '5px 12px', borderRadius: 8,
            border: copilotOpen ? '1px solid #6366f1' : '1px solid #e5e5ed',
            background: copilotOpen ? '#ededf7' : 'transparent',
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            color: copilotOpen ? '#6366f1' : '#9999aa',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          ✦ AI Copilot
        </button>

        <button
          onClick={openSettings}
          title="Settings (⌘,)"
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9999aa',
          }}
        >
          ⚙
        </button>
      </div>
    );
  }

  // Human DM header
  if (activeView.type === 'human-dm') {
    const user = users.find(u => u.id === activeView.userId);
    return (
      <div style={{
        height: 52, borderBottom: '1px solid #e5e5ed', display: 'flex',
        alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0, background: '#fff',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 10, background: '#ededf7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, color: '#6366f1',
        }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} style={{ width: 30, height: 30, borderRadius: 10 }} />
          ) : (
            (user?.name || '?')[0].toUpperCase()
          )}
        </div>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{user?.name || 'Unknown'}</span>
          <span style={{ color: '#9999aa', fontSize: 12, marginLeft: 8 }}>{user?.email}</span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => copilotOpen ? closeCopilot() : openCopilot('nexus')}
          title="AI Copilot"
          style={{
            padding: '5px 12px', borderRadius: 8,
            border: copilotOpen ? '1px solid #6366f1' : '1px solid #e5e5ed',
            background: copilotOpen ? '#ededf7' : 'transparent',
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            color: copilotOpen ? '#6366f1' : '#9999aa',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          ✦ AI Copilot
        </button>

        <button
          onClick={openSettings}
          title="Settings (⌘,)"
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9999aa',
          }}
        >
          ⚙
        </button>
      </div>
    );
  }

  // Pinned app — minimal header
  return (
    <div style={{
      height: 52, borderBottom: '1px solid #e5e5ed', display: 'flex',
      alignItems: 'center', padding: '0 20px', flexShrink: 0, background: '#fff',
    }}>
      <div style={{ flex: 1 }} />
      <button
        onClick={openSettings}
        title="Settings (⌘,)"
        style={{
          width: 32, height: 32, borderRadius: 8, border: 'none',
          background: 'transparent', cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9999aa',
        }}
      >
        ⚙
      </button>
    </div>
  );
}
