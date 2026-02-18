import { useState } from 'react';
import { useAgentStore } from '../../stores/agent-store';
import { useUIStore } from '../../stores/ui-store';
import { useCopilotStore } from '../../stores/copilot-store';

export default function AgentPickerDropdown() {
  const [open, setOpen] = useState(false);
  const agents = useAgentStore(s => s.agents);
  const copilotAgentId = useUIStore(s => s.copilotAgentId);
  const openCopilot = useUIStore(s => s.openCopilot);
  const reset = useCopilotStore(s => s.reset);

  const handleSelect = (agentId: string) => {
    if (agentId !== copilotAgentId) {
      reset();
      openCopilot(agentId);
    }
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e5ed',
          background: 'transparent', cursor: 'pointer', fontSize: 10,
          color: '#9999aa', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Switch agent"
      >
        ▼
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4,
            width: 180, background: '#fff', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #e5e5ed',
            padding: 4, zIndex: 50,
          }}>
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => handleSelect(agent.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', borderRadius: 6, border: 'none',
                  background: agent.id === copilotAgentId ? '#ededf7' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#1a1a2e',
                }}
                onMouseOver={e => { if (agent.id !== copilotAgentId) e.currentTarget.style.background = '#f4f4f8'; }}
                onMouseOut={e => { if (agent.id !== copilotAgentId) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: agent.color, fontSize: 14 }}>{agent.avatar}</span>
                <span>{agent.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
