import { contextBridge, ipcRenderer, shell } from 'electron';

contextBridge.exposeInMainWorld('nexus', {
  db: {
    getSessions: (agentId: string, userId?: string) => ipcRenderer.invoke('db:get-sessions', agentId, userId),
    createSession: (agentId: string, title: string, userId?: string) => ipcRenderer.invoke('db:create-session', agentId, title, userId),
    getMessages: (sessionId: string) => ipcRenderer.invoke('db:get-messages', sessionId),
    saveMessage: (msg: {
      id: string;
      session_id: string;
      role: string;
      sender_name?: string;
      content: string;
      mcp_app_data?: string;
      tool_calls?: string;
    }) => ipcRenderer.invoke('db:save-message', msg),
    deleteSession: (sessionId: string) => ipcRenderer.invoke('db:delete-session', sessionId),
    updateSessionTitle: (sessionId: string, title: string) => ipcRenderer.invoke('db:update-session-title', sessionId, title),
    // Participants
    getParticipants: (sessionId: string) => ipcRenderer.invoke('db:get-participants', sessionId),
    addParticipant: (sessionId: string, userId: string, role?: string) => ipcRenderer.invoke('db:add-participant', sessionId, userId, role),
    removeParticipant: (sessionId: string, userId: string) => ipcRenderer.invoke('db:remove-participant', sessionId, userId),
    // Copilot
    getCopilotMessages: (agentId: string, contextType: string, contextId: string) =>
      ipcRenderer.invoke('db:copilot-get-messages', agentId, contextType, contextId),
    saveCopilotMessage: (msg: {
      id: string;
      user_id: string;
      agent_id: string;
      context_type: string;
      context_id: string;
      role: string;
      content: string;
    }) => ipcRenderer.invoke('db:copilot-save-message', msg),
  },
  settings: {
    get: (userId?: string) => ipcRenderer.invoke('settings:get', userId),
    update: (updates: Record<string, unknown>, userId?: string) => ipcRenderer.invoke('settings:update', updates, userId),
  },
  app: {
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  },
  auth: {
    openLogin: () => ipcRenderer.invoke('auth:open-login'),
    onAuthCallback: (callback: (params: Record<string, string>) => void) => {
      const handler = (_event: any, params: Record<string, string>) => callback(params);
      ipcRenderer.on('auth:callback', handler);
      return () => ipcRenderer.removeListener('auth:callback', handler);
    },
  },
  mcp: {
    getRegistry: () => ipcRenderer.invoke('mcp:get-registry'),
    connect: (serverId: string) => ipcRenderer.invoke('mcp:connect', serverId),
    disconnect: (serverId: string) => ipcRenderer.invoke('mcp:disconnect', serverId),
    getAllStatuses: () => ipcRenderer.invoke('mcp:get-all-statuses'),
    listTools: (serverId: string) => ipcRenderer.invoke('mcp:list-tools', serverId),
    callTool: (serverId: string, toolName: string, args: Record<string, unknown>) =>
      ipcRenderer.invoke('mcp:call-tool', serverId, toolName, args),
    connectForAgent: (serverIds: string[]) => ipcRenderer.invoke('mcp:connect-for-agent', serverIds),
    addServer: (config: any) => ipcRenderer.invoke('mcp:add-server', config),
    updateServer: (config: any) => ipcRenderer.invoke('mcp:update-server', config),
    removeServer: (serverId: string) => ipcRenderer.invoke('mcp:remove-server', serverId),
    getAgentBindings: (agentId: string) => ipcRenderer.invoke('mcp:get-agent-bindings', agentId),
    addAgentBinding: (agentId: string, serverId: string) => ipcRenderer.invoke('mcp:add-agent-binding', agentId, serverId),
    removeAgentBinding: (agentId: string, serverId: string) => ipcRenderer.invoke('mcp:remove-agent-binding', agentId, serverId),
  },
});
