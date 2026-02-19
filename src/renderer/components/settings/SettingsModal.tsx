import { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';
import { useMcpStore } from '../../stores/mcp-store';
import { useToastStore } from '../../stores/toast-store';
import { initClaudeService } from '../../services/claude-service';
import { mcpBridge } from '../../services/mcp-bridge';
import { McpServerConfig, McpTool } from '../../../shared/types';
import McpServerForm from './McpServerForm';

type SettingsTab = 'general' | 'mcp';
type McpView = 'list' | 'add' | 'edit';

const statusColors: Record<string, string> = {
  connected: '#22c55e',
  connecting: '#f59e0b',
  error: '#ef4444',
  disconnected: '#9999aa',
};

export default function SettingsModal() {
  const settingsOpen = useUIStore(s => s.settingsOpen);
  const closeSettings = useUIStore(s => s.closeSettings);
  const apiKey = useAuthStore(s => s.apiKey);
  const setApiKey = useAuthStore(s => s.setApiKey);
  const registry = useMcpStore(s => s.registry);
  const statuses = useMcpStore(s => s.statuses);
  const refreshStatuses = useMcpStore(s => s.refreshStatuses);
  const mcpAddServer = useMcpStore(s => s.addServer);
  const mcpUpdateServer = useMcpStore(s => s.updateServer);
  const mcpRemoveServer = useMcpStore(s => s.removeServer);
  const addToast = useToastStore(s => s.addToast);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);

  // MCP tab state
  const [mcpView, setMcpView] = useState<McpView>('list');
  const [editingServer, setEditingServer] = useState<McpServerConfig | null>(null);
  const [mcpSaving, setMcpSaving] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [serverTools, setServerTools] = useState<Record<string, McpTool[]>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (settingsOpen && apiKey) {
      setKeyInput(apiKey);
      setShowKey(false);
    }
    if (settingsOpen) {
      setMcpView('list');
      setEditingServer(null);
    }
  }, [settingsOpen, apiKey]);

  if (!settingsOpen) return null;

  const handleSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      addToast('API key cannot be empty', 'error');
      return;
    }
    setSaving(true);
    try {
      await setApiKey(trimmed);
      initClaudeService(trimmed);
      addToast('API key saved', 'success');
    } catch (err: any) {
      addToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReconnect = async (serverId: string) => {
    setReconnectingId(serverId);
    try {
      await mcpBridge.connectForAgent([serverId]);
      await refreshStatuses();
      addToast('Server reconnected', 'success');
    } catch (err: any) {
      addToast(`Reconnect failed: ${err.message}`, 'error');
    } finally {
      setReconnectingId(null);
    }
  };

  const handleAddServer = async (config: McpServerConfig) => {
    setMcpSaving(true);
    try {
      await mcpAddServer(config);
      addToast(`Server "${config.name}" added`, 'success');
      setMcpView('list');
    } catch (err: any) {
      addToast(`Failed to add server: ${err.message}`, 'error');
    } finally {
      setMcpSaving(false);
    }
  };

  const handleUpdateServer = async (config: McpServerConfig) => {
    setMcpSaving(true);
    try {
      await mcpUpdateServer(config);
      addToast(`Server "${config.name}" updated`, 'success');
      setMcpView('list');
      setEditingServer(null);
    } catch (err: any) {
      addToast(`Failed to update server: ${err.message}`, 'error');
    } finally {
      setMcpSaving(false);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    setDeletingId(serverId);
    try {
      await mcpRemoveServer(serverId);
      addToast('Server removed', 'success');
    } catch (err: any) {
      addToast(`Failed to remove server: ${err.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleTools = async (serverId: string) => {
    const isExpanded = expandedTools[serverId];
    if (isExpanded) {
      setExpandedTools(prev => ({ ...prev, [serverId]: false }));
      return;
    }
    // Fetch tools if not cached
    if (!serverTools[serverId]) {
      try {
        const tools = await mcpBridge.listTools(serverId);
        setServerTools(prev => ({ ...prev, [serverId]: tools }));
      } catch {
        // ignore
      }
    }
    setExpandedTools(prev => ({ ...prev, [serverId]: true }));
  };

  const maskedKey = keyInput ? keyInput.slice(0, 8) + '\u2022'.repeat(Math.max(0, keyInput.length - 12)) + keyInput.slice(-4) : '';

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'mcp', label: 'MCP Servers' },
  ];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={closeSettings}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 620, maxHeight: '85vh', background: '#fff', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', overflow: 'hidden',
        }}
      >
        {/* Left nav */}
        <div style={{
          width: 160, background: '#f8f8fa', borderRight: '1px solid #e5e5ed',
          padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, padding: '0 10px 12px', color: '#1a1a2e' }}>
            Settings
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'mcp') { setMcpView('list'); setEditingServer(null); } }}
              style={{
                padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: 13, fontFamily: 'inherit',
                background: activeTab === tab.id ? '#e5e5ed' : 'transparent',
                color: activeTab === tab.id ? '#1a1a2e' : '#6b6b80',
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto', position: 'relative' }}>
          {/* Close button */}
          <button
            onClick={closeSettings}
            style={{
              position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 18, color: '#9999aa', lineHeight: 1,
            }}
          >
            ✕
          </button>

          {activeTab === 'general' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#1a1a2e' }}>General</h3>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#6b6b80', display: 'block', marginBottom: 6 }}>
                  Anthropic API Key
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={showKey ? keyInput : maskedKey}
                    onChange={e => { setKeyInput(e.target.value); setShowKey(true); }}
                    onFocus={() => setShowKey(true)}
                    placeholder="sk-ant-..."
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #e5e5ed', fontSize: 13, fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e5ed',
                      background: '#f4f4f8', cursor: 'pointer', fontSize: 12, color: '#6b6b80',
                      fontFamily: 'inherit',
                    }}
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: '#6366f1', color: '#fff', cursor: saving ? 'default' : 'pointer',
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>

            </div>
          )}

          {activeTab === 'mcp' && mcpView === 'list' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>MCP Servers</h3>
                <button
                  onClick={() => setMcpView('add')}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: '#6366f1', color: '#fff', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
                  }}
                >
                  + Add Server
                </button>
              </div>

              {registry.length === 0 && (
                <p style={{ fontSize: 13, color: '#9999aa' }}>No MCP servers configured. Click "+ Add Server" to get started.</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {registry.map(server => {
                  const status = statuses.find(s => s.id === server.id);
                  const statusStr = status?.status || 'disconnected';
                  const toolCount = status?.toolCount || 0;
                  const isConnected = statusStr === 'connected';
                  const isExpanded = expandedTools[server.id];
                  const tools = serverTools[server.id] || [];

                  return (
                    <div key={server.id}>
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: isExpanded ? '10px 10px 0 0' : 10,
                          border: '1px solid #e5e5ed',
                          borderBottom: isExpanded ? '1px solid #f0f0f5' : '1px solid #e5e5ed',
                          background: '#fafafa',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{server.icon || '🔌'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a2e' }}>{server.name}</span>
                            {server.isUserDefined && (
                              <span style={{
                                fontSize: 9, padding: '1px 5px', borderRadius: 4,
                                background: '#ededf7', color: '#6366f1', fontWeight: 600,
                              }}>
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#9999aa', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {server.transport} · {statusStr}
                            {status?.error && <span style={{ color: '#ef4444' }}> · {status.error}</span>}
                            {isConnected && toolCount > 0 && (
                              <button
                                onClick={() => toggleTools(server.id)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  fontSize: 11, color: '#6366f1', padding: '0 4px', fontFamily: 'inherit',
                                }}
                              >
                                {toolCount} tool{toolCount !== 1 ? 's' : ''} {isExpanded ? '▾' : '▸'}
                              </button>
                            )}
                          </div>
                        </div>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: statusColors[statusStr] || '#9999aa', flexShrink: 0,
                        }} />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleReconnect(server.id)}
                            disabled={reconnectingId === server.id}
                            style={{
                              padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e5ed',
                              background: '#fff', cursor: reconnectingId === server.id ? 'default' : 'pointer',
                              fontSize: 11, color: '#6b6b80', fontFamily: 'inherit',
                              opacity: reconnectingId === server.id ? 0.6 : 1,
                            }}
                          >
                            {reconnectingId === server.id ? '...' : 'Reconnect'}
                          </button>
                          {server.isUserDefined && (
                            <>
                              <button
                                onClick={() => { setEditingServer(server); setMcpView('edit'); }}
                                style={{
                                  padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e5ed',
                                  background: '#fff', cursor: 'pointer',
                                  fontSize: 11, color: '#6b6b80', fontFamily: 'inherit',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteServer(server.id)}
                                disabled={deletingId === server.id}
                                style={{
                                  padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca',
                                  background: '#fff', cursor: deletingId === server.id ? 'default' : 'pointer',
                                  fontSize: 11, color: '#ef4444', fontFamily: 'inherit',
                                  opacity: deletingId === server.id ? 0.6 : 1,
                                }}
                              >
                                {deletingId === server.id ? '...' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Expandable tools list */}
                      {isExpanded && (
                        <div style={{
                          border: '1px solid #e5e5ed', borderTop: 'none',
                          borderRadius: '0 0 10px 10px', background: '#f8f8fa',
                          padding: '8px 14px',
                        }}>
                          {tools.length === 0 ? (
                            <span style={{ fontSize: 11, color: '#9999aa' }}>Loading tools...</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {tools.map(tool => (
                                <div key={tool.name} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 500, color: '#1a1a2e', fontFamily: 'monospace' }}>
                                    {tool.name}
                                  </span>
                                  {tool.description && (
                                    <span style={{ fontSize: 11, color: '#9999aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {tool.description}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'mcp' && mcpView === 'add' && (
            <McpServerForm
              onSave={handleAddServer}
              onCancel={() => setMcpView('list')}
              saving={mcpSaving}
            />
          )}

          {activeTab === 'mcp' && mcpView === 'edit' && editingServer && (
            <McpServerForm
              initial={editingServer}
              onSave={handleUpdateServer}
              onCancel={() => { setMcpView('list'); setEditingServer(null); }}
              saving={mcpSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
