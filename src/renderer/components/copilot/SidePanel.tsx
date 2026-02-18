import { useEffect } from 'react';
import { useUIStore } from '../../stores/ui-store';
import { useCopilotStore } from '../../stores/copilot-store';
import { useAgentStore } from '../../stores/agent-store';
import { useCopilot } from '../../hooks/useCopilot';
import CopilotMessageList from './CopilotMessageList';
import CopilotInput from './CopilotInput';
import AgentPickerDropdown from './AgentPickerDropdown';

export default function SidePanel() {
  const copilotAgentId = useUIStore(s => s.copilotAgentId);
  const closeCopilot = useUIStore(s => s.closeCopilot);
  const activeView = useUIStore(s => s.activeView);
  const agents = useAgentStore(s => s.agents);
  const reset = useCopilotStore(s => s.reset);
  const loadMessages = useCopilotStore(s => s.loadMessages);
  const { messages, isStreaming, currentText, sendMessage, postToChannel } = useCopilot();

  const agent = agents.find(a => a.id === copilotAgentId);

  // Load messages when context changes
  useEffect(() => {
    if (!copilotAgentId) return;
    const contextType = activeView.type === 'channel' ? 'channel' : 'dm';
    const contextId = activeView.type === 'channel'
      ? (activeView as any).channelId
      : activeView.type === 'human-dm'
        ? (activeView as any).userId
        : '';
    if (contextId) {
      loadMessages(copilotAgentId, contextType, contextId);
    }
  }, [copilotAgentId, activeView]);

  return (
    <div style={{
      width: 340, borderLeft: '1px solid #e5e5ed', background: '#fff',
      display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: 0,
    }}>
      {/* Header */}
      <div style={{
        height: 48, borderBottom: '1px solid #e5e5ed',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8,
        flexShrink: 0,
      }}>
        {agent && (
          <div style={{
            width: 24, height: 24, borderRadius: 8,
            background: agent.color + '20', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: agent.color,
          }}>
            {agent.avatar}
          </div>
        )}
        <span style={{ fontWeight: 600, fontSize: 13.5, flex: 1 }}>
          {agent?.name || 'AI Copilot'}
        </span>
        <AgentPickerDropdown />
        <button
          onClick={() => { reset(); closeCopilot(); }}
          style={{
            width: 24, height: 24, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 14,
            color: '#9999aa', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Close copilot"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <CopilotMessageList
        messages={messages}
        isStreaming={isStreaming}
        currentText={currentText}
        agentName={agent?.name || 'AI'}
        agentAvatar={agent?.avatar || '✦'}
        agentColor={agent?.color || '#6366f1'}
        onPostToChannel={postToChannel}
      />

      {/* Input */}
      <CopilotInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        placeholder={`Ask ${agent?.name || 'AI'}...`}
      />
    </div>
  );
}
