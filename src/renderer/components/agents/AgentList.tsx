import { useState } from 'react';
import { useAgent } from '../../hooks/useAgent';
import { useAgentStore } from '../../stores/agent-store';
import { useUIStore } from '../../stores/ui-store';
import { useChatStore } from '../../stores/chat-store';
import { useMcpStore } from '../../stores/mcp-store';
import AgentAvatar from './AgentAvatar';
import { AgentSkeleton } from '../ui/LoadingSkeleton';

export default function AgentList() {
  const { generalAgent, specialistAgents, activeAgentId, setActiveAgent } = useAgent();
  const isLoading = useAgentStore(s => s.isLoading);
  const setActiveView = useUIStore(s => s.setActiveView);
  const sessions = useChatStore(s => s.sessions);
  const loadSessions = useChatStore(s => s.loadSessions);
  const statuses = useMcpStore(s => s.statuses);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) return <AgentSkeleton />;

  // Session count for active agent only (sessions are loaded per-agent)
  const sessionCount = sessions.length;

  // MCP status for an agent's servers
  const getMcpStatusColor = (serverIds?: string[]): string | null => {
    if (!serverIds?.length) return null;
    const agentStatuses = statuses.filter(s => serverIds.includes(s.id));
    if (!agentStatuses.length) return null;
    if (agentStatuses.some(s => s.status === 'error')) return '#ef4444';
    if (agentStatuses.some(s => s.status === 'connecting')) return '#f59e0b';
    if (agentStatuses.every(s => s.status === 'connected')) return '#22c55e';
    return '#9999aa';
  };

  const handleAgentClick = async (agentId: string) => {
    setActiveAgent(agentId);
    setActiveView({ type: 'agent-dm', agentId });
    await loadSessions(agentId);
  };

  const buttonStyle = (agentId: string): React.CSSProperties => ({
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
    fontFamily: 'inherit',
    background: activeAgentId === agentId ? '#e5e5ed' : hoveredId === agentId ? '#ededf3' : 'transparent',
    color: activeAgentId === agentId ? '#1a1a2e' : '#6b6b80',
    transition: 'background 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* General agent */}
      {generalAgent && (
        <button
          onClick={() => handleAgentClick(generalAgent.id)}
          onMouseEnter={() => setHoveredId(generalAgent.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{ ...buttonStyle(generalAgent.id), padding: '10px 10px', marginBottom: 4 }}
        >
          <AgentAvatar agent={generalAgent} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{generalAgent.name}</div>
            <div style={{ fontSize: 10.5, color: '#9999aa' }}>{generalAgent.role}</div>
          </div>
          {activeAgentId === generalAgent.id && sessionCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
              background: '#e5e5ed', color: '#6b6b80', flexShrink: 0,
            }}>
              {sessionCount}
            </span>
          )}
          {(() => {
            const color = getMcpStatusColor(generalAgent.mcpServers);
            return color ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} /> : null;
          })()}
        </button>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: '#ededf3', margin: '0 4px 4px' }} />

      {/* Specialists label */}
      <div style={{ padding: '4px 10px 6px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#bbbbc8' }}>
        Specialists
      </div>

      {/* Specialist agents */}
      {specialistAgents.map(agent => (
        <button
          key={agent.id}
          onClick={() => handleAgentClick(agent.id)}
          onMouseEnter={() => setHoveredId(agent.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={buttonStyle(agent.id)}
        >
          <AgentAvatar agent={agent} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13 }}>{agent.name}</div>
            <div style={{ fontSize: 10.5, color: '#9999aa' }}>{agent.role}</div>
          </div>
          {activeAgentId === agent.id && sessionCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
              background: '#e5e5ed', color: '#6b6b80', flexShrink: 0,
            }}>
              {sessionCount}
            </span>
          )}
          {(() => {
            const color = getMcpStatusColor(agent.mcpServers);
            return color ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} /> : null;
          })()}
        </button>
      ))}
    </div>
  );
}
