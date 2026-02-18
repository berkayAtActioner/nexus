import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/auth-store';
import { useAgentStore } from './stores/agent-store';
import { useChatStore } from './stores/chat-store';
import { useMcpStore } from './stores/mcp-store';
import { useUIStore } from './stores/ui-store';
import { initClaudeService } from './services/claude-service';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import ActivityBar from './components/layout/ActivityBar';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MainPanel from './components/layout/MainPanel';
import ApiKeySetup from './components/settings/ApiKeySetup';
import SettingsModal from './components/settings/SettingsModal';
import ToastContainer from './components/ui/Toast';
import LoginPage from './components/auth/LoginPage';
import StreamProvider from './components/channels/StreamProvider';

export default function App() {
  const { apiKey, isLoading: authLoading, isAuthenticated, loadSettings } = useAuthStore();
  const { fetchAgents, activeAgentId } = useAgentStore();
  const loadSessions = useChatStore(s => s.loadSessions);
  const settingsOpen = useUIStore(s => s.settingsOpen);
  const [initError, setInitError] = useState<string | null>(null);

  useKeyboardShortcuts();

  // Get active agent for MCP connection
  const activeAgent = useAgentStore(s => s.getActiveAgent());
  const mcpInitialized = useMcpStore(s => s.isInitialized);

  // Initialize on mount
  useEffect(() => {
    loadSettings().catch(err => {
      console.error('Init error:', err);
      setInitError(String(err));
    });
    useUIStore.getState().loadPinnedApps().catch(err =>
      console.error('Load pinned apps error:', err)
    );
  }, []);

  // Once settings loaded, fetch agents and init Claude
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchAgents().catch(err => console.error('Fetch agents error:', err));
    if (apiKey) {
      initClaudeService(apiKey);
    }
    // Initialize MCP store
    useMcpStore.getState().initialize().catch(err =>
      console.error('MCP init error:', err)
    );
    // Fetch stream config, then ensure we have a stream token
    useAuthStore.getState().fetchStreamConfig()
      .then(() => useAuthStore.getState().ensureStreamToken())
      .catch(err => console.error('Stream config error:', err));
  }, [authLoading, apiKey, isAuthenticated]);

  // Load sessions when active agent changes
  useEffect(() => {
    if (activeAgentId && isAuthenticated) {
      loadSessions(activeAgentId);
    }
  }, [activeAgentId, isAuthenticated]);

  // Load agent MCP bindings and auto-connect effective servers when active agent changes
  // Also re-runs after MCP initialization completes (registry must be loaded before connectForAgent works)
  useEffect(() => {
    if (!activeAgent?.id || !mcpInitialized) return;
    const mcpState = useMcpStore.getState();
    mcpState.loadAgentBindings(activeAgent.id).then(() => {
      const effectiveServers = useMcpStore.getState().getEffectiveServers(activeAgent.id, activeAgent.mcpServers || []);
      if (effectiveServers.length > 0) {
        useMcpStore.getState().connectForAgent(effectiveServers);
      }
    });
  }, [activeAgent?.id, mcpInitialized]);

  // Show init error
  if (initError) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#ef4444' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Initialization Error</h2>
          <p style={{ color: '#666', marginTop: 8 }}>{initError}</p>
        </div>
      </div>
    );
  }

  // Show loading
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ color: '#9999aa', fontSize: 14 }}>Loading Nexus...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show API key setup
  if (!apiKey) {
    return <ApiKeySetup />;
  }

  return (
    <StreamProvider>
      <div className="h-screen w-screen flex bg-bg-main text-text-primary overflow-hidden"
        style={{ height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden' }}>
        {/* Titlebar drag region for macOS — only covers activity bar + sidebar */}
        <div className="titlebar-drag" style={{ position: 'fixed', top: 0, left: 0, width: 288, height: 32, zIndex: 50 }} />

        <ActivityBar />
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <Header />
          <MainPanel />
        </div>

        {settingsOpen && <SettingsModal />}
        <ToastContainer />
      </div>
    </StreamProvider>
  );
}
