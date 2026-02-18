import { create } from 'zustand';
import { McpServerConfig, McpServerStatus, McpTool } from '../../shared/types';
import { mcpBridge } from '../services/mcp-bridge';
import { useToastStore } from './toast-store';

interface McpState {
  registry: McpServerConfig[];
  statuses: McpServerStatus[];
  toolsByServer: Record<string, McpTool[]>;
  isInitialized: boolean;
  agentBindings: Record<string, string[]>;

  initialize: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  connectForAgent: (serverIds: string[]) => Promise<void>;
  getToolsForServers: (serverIds: string[]) => McpTool[];
  callTool: (serverId: string, toolName: string, args: Record<string, unknown>) => Promise<any>;
  addServer: (config: McpServerConfig) => Promise<void>;
  updateServer: (config: McpServerConfig) => Promise<void>;
  removeServer: (serverId: string) => Promise<void>;

  // Agent binding methods
  loadAgentBindings: (agentId: string) => Promise<void>;
  addAgentBinding: (agentId: string, serverId: string) => Promise<void>;
  removeAgentBinding: (agentId: string, serverId: string) => Promise<void>;
  getEffectiveServers: (agentId: string, defaultServerIds: string[]) => string[];
}

export const useMcpStore = create<McpState>((set, get) => ({
  registry: [],
  statuses: [],
  toolsByServer: {},
  isInitialized: false,
  agentBindings: {},

  initialize: async () => {
    if (get().isInitialized) return;
    try {
      const [registry, statuses] = await Promise.all([
        mcpBridge.getRegistry(),
        mcpBridge.getAllStatuses(),
      ]);
      set({ registry, statuses, isInitialized: true });
    } catch (error) {
      console.error('[MCP Store] Init failed:', error);
      set({ isInitialized: true });
    }
  },

  refreshStatuses: async () => {
    try {
      const statuses = await mcpBridge.getAllStatuses();
      set({ statuses });
    } catch (error) {
      console.error('[MCP Store] Failed to refresh statuses:', error);
    }
  },

  connectForAgent: async (serverIds: string[]) => {
    if (!serverIds.length) return;

    // Only connect servers that are in the registry
    const registry = get().registry;
    const validIds = serverIds.filter(id => registry.some(s => s.id === id));
    if (!validIds.length) return;

    try {
      const statuses = await mcpBridge.connectForAgent(validIds);
      set({ statuses });

      // Fetch tools for newly connected servers
      const toolsByServer = { ...get().toolsByServer };
      for (const id of validIds) {
        const status = statuses.find(s => s.id === id);
        if (status?.status === 'connected') {
          toolsByServer[id] = await mcpBridge.listTools(id);
        }
      }
      set({ toolsByServer });

      // Toast warning for servers with errors
      const errorServers = statuses.filter(s => validIds.includes(s.id) && s.status === 'error');
      if (errorServers.length > 0) {
        const names = errorServers.map(s => s.name).join(', ');
        useToastStore.getState().addToast(`MCP connection failed: ${names}`, 'warning');
      }
    } catch (error) {
      console.error('[MCP Store] connectForAgent failed:', error);
    }
  },

  getToolsForServers: (serverIds: string[]): McpTool[] => {
    const { toolsByServer } = get();
    const tools: McpTool[] = [];
    for (const id of serverIds) {
      if (toolsByServer[id]) {
        tools.push(...toolsByServer[id]);
      }
    }
    return tools;
  },

  callTool: async (serverId: string, toolName: string, args: Record<string, unknown>) => {
    return mcpBridge.callTool(serverId, toolName, args);
  },

  addServer: async (config: McpServerConfig) => {
    const registry = await mcpBridge.addServer(config);
    set({ registry });
    // Auto-connect and fetch tools
    try {
      await mcpBridge.connect(config.id);
      const statuses = await mcpBridge.getAllStatuses();
      const toolsByServer = { ...get().toolsByServer };
      const status = statuses.find(s => s.id === config.id);
      if (status?.status === 'connected') {
        toolsByServer[config.id] = await mcpBridge.listTools(config.id);
      }
      set({ statuses, toolsByServer });
    } catch {
      const statuses = await mcpBridge.getAllStatuses();
      set({ statuses });
    }
  },

  updateServer: async (config: McpServerConfig) => {
    const registry = await mcpBridge.updateServer(config);
    set({ registry });
    // Reconnect and re-fetch tools
    try {
      await mcpBridge.connect(config.id);
      const statuses = await mcpBridge.getAllStatuses();
      const toolsByServer = { ...get().toolsByServer };
      const status = statuses.find(s => s.id === config.id);
      if (status?.status === 'connected') {
        toolsByServer[config.id] = await mcpBridge.listTools(config.id);
      } else {
        delete toolsByServer[config.id];
      }
      set({ statuses, toolsByServer });
    } catch {
      const statuses = await mcpBridge.getAllStatuses();
      set({ statuses });
    }
  },

  removeServer: async (serverId: string) => {
    const registry = await mcpBridge.removeServer(serverId);
    const statuses = await mcpBridge.getAllStatuses();
    const toolsByServer = { ...get().toolsByServer };
    delete toolsByServer[serverId];
    set({ registry, statuses, toolsByServer });
  },

  // Agent binding methods
  loadAgentBindings: async (agentId: string) => {
    try {
      const serverIds = await mcpBridge.getAgentBindings(agentId);
      set({ agentBindings: { ...get().agentBindings, [agentId]: serverIds } });
    } catch (error) {
      console.error('[MCP Store] loadAgentBindings failed:', error);
    }
  },

  addAgentBinding: async (agentId: string, serverId: string) => {
    try {
      await mcpBridge.addAgentBinding(agentId, serverId);
      const current = get().agentBindings[agentId] || [];
      if (!current.includes(serverId)) {
        set({ agentBindings: { ...get().agentBindings, [agentId]: [...current, serverId] } });
      }
      // Connect and fetch tools for the newly bound server
      await mcpBridge.connect(serverId);
      const statuses = await mcpBridge.getAllStatuses();
      const toolsByServer = { ...get().toolsByServer };
      const status = statuses.find(s => s.id === serverId);
      if (status?.status === 'connected') {
        toolsByServer[serverId] = await mcpBridge.listTools(serverId);
      }
      set({ statuses, toolsByServer });
    } catch (error) {
      console.error('[MCP Store] addAgentBinding failed:', error);
    }
  },

  removeAgentBinding: async (agentId: string, serverId: string) => {
    try {
      await mcpBridge.removeAgentBinding(agentId, serverId);
      const current = get().agentBindings[agentId] || [];
      set({ agentBindings: { ...get().agentBindings, [agentId]: current.filter(id => id !== serverId) } });
    } catch (error) {
      console.error('[MCP Store] removeAgentBinding failed:', error);
    }
  },

  getEffectiveServers: (agentId: string, defaultServerIds: string[]): string[] => {
    const userBindings = get().agentBindings[agentId] || [];
    return [...new Set([...defaultServerIds, ...userBindings])];
  },
}));
