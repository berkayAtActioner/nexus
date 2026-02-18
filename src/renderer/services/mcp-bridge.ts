import { McpServerConfig, McpServerStatus, McpTool } from '../../shared/types';

export const mcpBridge = {
  getRegistry: (): Promise<McpServerConfig[]> =>
    window.nexus.mcp.getRegistry(),

  connect: (serverId: string): Promise<McpServerStatus> =>
    window.nexus.mcp.connect(serverId),

  disconnect: (serverId: string): Promise<void> =>
    window.nexus.mcp.disconnect(serverId),

  getAllStatuses: (): Promise<McpServerStatus[]> =>
    window.nexus.mcp.getAllStatuses(),

  listTools: (serverId: string): Promise<McpTool[]> =>
    window.nexus.mcp.listTools(serverId),

  callTool: (serverId: string, toolName: string, args: Record<string, unknown>): Promise<any> =>
    window.nexus.mcp.callTool(serverId, toolName, args),

  connectForAgent: (serverIds: string[]): Promise<McpServerStatus[]> =>
    window.nexus.mcp.connectForAgent(serverIds),

  addServer: (config: McpServerConfig): Promise<McpServerConfig[]> =>
    window.nexus.mcp.addServer(config),

  updateServer: (config: McpServerConfig): Promise<McpServerConfig[]> =>
    window.nexus.mcp.updateServer(config),

  removeServer: (serverId: string): Promise<McpServerConfig[]> =>
    window.nexus.mcp.removeServer(serverId),

  getAgentBindings: (agentId: string): Promise<string[]> =>
    window.nexus.mcp.getAgentBindings(agentId),

  addAgentBinding: (agentId: string, serverId: string): Promise<void> =>
    window.nexus.mcp.addAgentBinding(agentId, serverId),

  removeAgentBinding: (agentId: string, serverId: string): Promise<void> =>
    window.nexus.mcp.removeAgentBinding(agentId, serverId),
};
