import { ipcMain, shell } from 'electron';
import { getSessions, createSession, getMessages, saveMessage, deleteSession, updateSessionTitle } from './store/sessions';
import { getSettings, updateSettings } from './store/settings';
import { getParticipants, addParticipant, removeParticipant } from './store/participants';
import { getCopilotMessages, saveCopilotMessage } from './store/copilot';
import { getAgentMcpBindings, addAgentMcpBinding, removeAgentMcpBinding } from './store/mcp-servers';
import { mcpManager } from './mcp/mcp-manager';
import { McpServerConfig } from '../shared/types';

export function registerIpcHandlers(): void {
  // Session handlers
  ipcMain.handle('db:get-sessions', (_event, agentId: string, userId?: string) => {
    return getSessions(agentId, userId);
  });

  ipcMain.handle('db:create-session', (_event, agentId: string, title: string, userId?: string) => {
    return createSession(agentId, title, userId);
  });

  ipcMain.handle('db:get-messages', (_event, sessionId: string) => {
    return getMessages(sessionId);
  });

  ipcMain.handle('db:save-message', (_event, msg: {
    id: string;
    session_id: string;
    role: string;
    sender_name?: string;
    content: string;
    mcp_app_data?: string;
    tool_calls?: string;
  }) => {
    return saveMessage(msg);
  });

  ipcMain.handle('db:delete-session', (_event, sessionId: string) => {
    return deleteSession(sessionId);
  });

  ipcMain.handle('db:update-session-title', (_event, sessionId: string, title: string) => {
    return updateSessionTitle(sessionId, title);
  });

  // Participant handlers
  ipcMain.handle('db:get-participants', (_event, sessionId: string) => {
    return getParticipants(sessionId);
  });

  ipcMain.handle('db:add-participant', (_event, sessionId: string, userId: string, role?: string) => {
    return addParticipant(sessionId, userId, role);
  });

  ipcMain.handle('db:remove-participant', (_event, sessionId: string, userId: string) => {
    return removeParticipant(sessionId, userId);
  });

  // Copilot handlers
  ipcMain.handle('db:copilot-get-messages', (_event, agentId: string, contextType: string, contextId: string) => {
    return getCopilotMessages(agentId, contextType, contextId);
  });

  ipcMain.handle('db:copilot-save-message', (_event, msg: {
    id: string;
    user_id: string;
    agent_id: string;
    context_type: string;
    context_id: string;
    role: string;
    content: string;
  }) => {
    return saveCopilotMessage(msg);
  });

  // Settings handlers
  ipcMain.handle('settings:get', (_event, userId?: string) => {
    return getSettings(userId);
  });

  ipcMain.handle('settings:update', (_event, updates: Record<string, unknown>, userId?: string) => {
    return updateSettings(updates, userId);
  });

  // App handlers
  ipcMain.handle('app:get-platform', () => {
    return process.platform;
  });

  // Auth handlers
  ipcMain.handle('auth:open-login', () => {
    shell.openExternal('http://localhost:3001/api/auth/google');
  });

  // MCP handlers
  ipcMain.handle('mcp:get-registry', () => {
    return mcpManager.getRegistry();
  });

  ipcMain.handle('mcp:connect', async (_event, serverId: string) => {
    await mcpManager.connect(serverId);
    return mcpManager.getStatus(serverId);
  });

  ipcMain.handle('mcp:disconnect', async (_event, serverId: string) => {
    await mcpManager.disconnect(serverId);
  });

  ipcMain.handle('mcp:get-all-statuses', () => {
    return mcpManager.getAllStatuses();
  });

  ipcMain.handle('mcp:list-tools', (_event, serverId: string) => {
    return mcpManager.listTools(serverId);
  });

  ipcMain.handle('mcp:call-tool', async (_event, serverId: string, toolName: string, args: Record<string, unknown>) => {
    return mcpManager.callTool(serverId, toolName, args);
  });

  ipcMain.handle('mcp:connect-for-agent', async (_event, serverIds: string[]) => {
    await mcpManager.connectForAgent(serverIds);
    return mcpManager.getAllStatuses();
  });

  // MCP CRUD handlers
  ipcMain.handle('mcp:add-server', async (_event, config: McpServerConfig) => {
    await mcpManager.addServer(config);
    return mcpManager.getRegistry();
  });

  ipcMain.handle('mcp:update-server', async (_event, config: McpServerConfig) => {
    await mcpManager.updateServer(config);
    return mcpManager.getRegistry();
  });

  ipcMain.handle('mcp:remove-server', async (_event, serverId: string) => {
    await mcpManager.removeServer(serverId);
    return mcpManager.getRegistry();
  });

  // Agent MCP binding handlers
  ipcMain.handle('mcp:get-agent-bindings', (_event, agentId: string) => {
    return getAgentMcpBindings(agentId);
  });

  ipcMain.handle('mcp:add-agent-binding', (_event, agentId: string, serverId: string) => {
    addAgentMcpBinding(agentId, serverId);
  });

  ipcMain.handle('mcp:remove-agent-binding', (_event, agentId: string, serverId: string) => {
    removeAgentMcpBinding(agentId, serverId);
  });
}
