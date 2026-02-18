import { useAgent } from '../../hooks/useAgent';
import AgentAvatar from '../agents/AgentAvatar';

interface Props {
  text: string;
  activeToolCall?: { toolName: string; serverId: string } | null;
}

export default function StreamingMessage({ text, activeToolCall }: Props) {
  const { activeAgent } = useAgent();

  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
      {activeAgent && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <AgentAvatar agent={activeAgent} size={34} />
        </div>
      )}
      <div style={{
        maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      }}>
        <div style={{
          padding: '10px 14px', borderRadius: 12, borderTopLeftRadius: 4,
          background: '#f8f8fa', border: '1px solid #ededf3',
        }}>
          {text ? (
            <div style={{
              color: '#1a1a2e', lineHeight: 1.6,
              whiteSpace: 'pre-wrap', fontSize: 13.5,
            }}>
              {text}
              <span style={{
                display: 'inline-block', width: 2, height: 16,
                background: '#9999aa', marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'pulse 1s infinite',
              }} />
            </div>
          ) : activeToolCall ? null : (
            <div style={{
              color: '#9999aa', fontSize: 13.5,
            }}>
              <span style={{
                display: 'inline-block', width: 2, height: 16,
                background: '#9999aa',
                verticalAlign: 'text-bottom',
                animation: 'pulse 1s infinite',
              }} />
            </div>
          )}
          {activeToolCall && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: text ? 8 : 0,
              padding: '4px 0',
              color: '#6366f1', fontSize: 12,
            }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', border: '2px solid #6366f1',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontFamily: 'monospace' }}>
                Calling {activeToolCall.toolName}...
              </span>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
