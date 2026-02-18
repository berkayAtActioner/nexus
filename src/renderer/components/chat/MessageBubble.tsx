import { ChatMessage, McpAppData, ToolCallDisplay } from '../../../shared/types';
import { useAgent } from '../../hooks/useAgent';
import AgentAvatar from '../agents/AgentAvatar';
import McpAppRenderer from '../mcp-apps/McpAppRenderer';

interface Props {
  message: ChatMessage;
  onDrilldown?: (serverId: string, toolName: string, args: Record<string, unknown>) => void;
}

function ToolCallPills({ toolCalls }: { toolCalls: ToolCallDisplay[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {toolCalls.map((tc) => (
        <div
          key={tc.id}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 6,
            background: '#f0f0f5',
            border: '1px solid #e5e5ed',
            fontSize: 11.5,
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: tc.isError ? '#ef4444' : '#22c55e',
            flexShrink: 0,
          }} />
          <span style={{ fontFamily: 'monospace', color: '#5a5a70' }}>
            {tc.toolName}
          </span>
          {tc.duration != null && (
            <span style={{ color: '#9999aa', fontSize: 10.5 }}>
              {tc.duration < 1000 ? `${tc.duration}ms` : `${(tc.duration / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MessageBubble({ message, onDrilldown }: Props) {
  const { activeAgent } = useAgent();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  // Parse tool calls if present
  let toolCalls: ToolCallDisplay[] | null = null;
  if (message.tool_calls) {
    try {
      toolCalls = JSON.parse(message.tool_calls);
    } catch { /* ignore */ }
  }

  // Parse MCP app data if present
  let mcpApps: McpAppData[] | null = null;
  if (message.mcp_app_data) {
    try {
      mcpApps = JSON.parse(message.mcp_app_data);
    } catch { /* ignore */ }
  }

  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <span style={{
          padding: '4px 12px', borderRadius: 20,
          background: '#f4f4f8', color: '#9999aa', fontSize: 11.5,
        }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '8px 0',
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      {isAssistant && activeAgent && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <AgentAvatar agent={activeAgent} size={34} />
        </div>
      )}
      <div style={{
        maxWidth: mcpApps && mcpApps.length > 0 ? '85%' : '70%',
        display: 'flex', flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        <div style={{
          padding: '10px 14px', borderRadius: 12,
          borderTopRightRadius: isUser ? 4 : 12,
          borderTopLeftRadius: isAssistant ? 4 : 12,
          background: isUser ? '#ededf7' : '#f8f8fa',
          border: isAssistant ? '1px solid #ededf3' : 'none',
        }}>
          <div style={{
            color: '#1a1a2e', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', fontSize: 13.5,
          }}>
            {message.content}
          </div>
          {isAssistant && toolCalls && toolCalls.length > 0 && (
            <ToolCallPills toolCalls={toolCalls} />
          )}
        </div>
        {isAssistant && mcpApps && mcpApps.length > 0 && (
          <div style={{ width: '100%', marginTop: 4 }}>
            {mcpApps.map((app, i) => (
              <McpAppRenderer
                key={i}
                appData={app}
                compact={true}
                onDrilldown={onDrilldown}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
