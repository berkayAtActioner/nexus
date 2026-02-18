import { useState, useRef, useEffect } from 'react';
import { useMcpStore } from '../../stores/mcp-store';

interface McpServerPickerProps {
  agentId: string;
  boundServerIds: string[];
  onClose: () => void;
}

const transportColors: Record<string, string> = {
  stdio: '#8b5cf6',
  sse: '#6366f1',
  http: '#3b82f6',
};

export default function McpServerPicker({ agentId, boundServerIds, onClose }: McpServerPickerProps) {
  const registry = useMcpStore(s => s.registry);
  const addAgentBinding = useMcpStore(s => s.addAgentBinding);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Filter: show servers not already bound
  const available = registry.filter(s =>
    !boundServerIds.includes(s.id) &&
    (search === '' || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = async (serverId: string) => {
    await addAgentBinding(agentId, serverId);
    onClose();
  };

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, marginTop: 4,
      width: 260, background: '#fff', border: '1px solid #e5e5ed',
      borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      zIndex: 100, overflow: 'hidden',
    }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f5' }}>
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search MCP servers..."
          style={{
            width: '100%', padding: '6px 10px', borderRadius: 6,
            border: '1px solid #e5e5ed', fontSize: 12.5, outline: 'none',
            background: '#f8f8fa',
          }}
        />
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {available.length === 0 ? (
          <div style={{ padding: '16px 14px', color: '#9999aa', fontSize: 12, textAlign: 'center' }}>
            No servers available
          </div>
        ) : (
          available.map(server => (
            <button
              key={server.id}
              onClick={() => handleSelect(server.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left', fontSize: 12.5,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f4f4f8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 14 }}>{server.icon || '🔌'}</span>
              <span style={{ flex: 1, fontWeight: 500, color: '#1a1a2e' }}>{server.name}</span>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 4,
                background: `${transportColors[server.transport] || '#9999aa'}15`,
                color: transportColors[server.transport] || '#9999aa',
                fontWeight: 600, textTransform: 'uppercase',
              }}>
                {server.transport}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
