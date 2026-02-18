import { ChatMessage, ChatSession, UserSettings, McpServerConfig, McpServerStatus, McpTool, SessionParticipant, CopilotMessage } from '../../shared/types';

interface NexusAPI {
  db: {
    getSessions: (agentId: string, userId?: string) => Promise<ChatSession[]>;
    createSession: (agentId: string, title: string, userId?: string) => Promise<ChatSession>;
    getMessages: (sessionId: string) => Promise<ChatMessage[]>;
    saveMessage: (msg: {
      id: string;
      session_id: string;
      role: string;
      sender_name?: string;
      content: string;
      mcp_app_data?: string;
      tool_calls?: string;
    }) => Promise<ChatMessage>;
    deleteSession: (sessionId: string) => Promise<void>;
    updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
    getParticipants: (sessionId: string) => Promise<SessionParticipant[]>;
    addParticipant: (sessionId: string, userId: string, role?: string) => Promise<SessionParticipant>;
    removeParticipant: (sessionId: string, userId: string) => Promise<void>;
    getCopilotMessages: (agentId: string, contextType: string, contextId: string) => Promise<CopilotMessage[]>;
    saveCopilotMessage: (msg: {
      id: string;
      user_id: string;
      agent_id: string;
      context_type: string;
      context_id: string;
      role: string;
      content: string;
    }) => Promise<CopilotMessage>;
  };
  settings: {
    get: (userId?: string) => Promise<UserSettings>;
    update: (updates: Record<string, unknown>, userId?: string) => Promise<UserSettings>;
  };
  app: {
    getPlatform: () => Promise<string>;
  };
  auth: {
    openLogin: () => Promise<void>;
    onAuthCallback: (callback: (params: Record<string, string>) => void) => () => void;
  };
  mcp: {
    getRegistry: () => Promise<McpServerConfig[]>;
    connect: (serverId: string) => Promise<McpServerStatus>;
    disconnect: (serverId: string) => Promise<void>;
    getAllStatuses: () => Promise<McpServerStatus[]>;
    listTools: (serverId: string) => Promise<McpTool[]>;
    callTool: (serverId: string, toolName: string, args: Record<string, unknown>) => Promise<any>;
    connectForAgent: (serverIds: string[]) => Promise<McpServerStatus[]>;
    addServer: (config: McpServerConfig) => Promise<McpServerConfig[]>;
    updateServer: (config: McpServerConfig) => Promise<McpServerConfig[]>;
    removeServer: (serverId: string) => Promise<McpServerConfig[]>;
    getAgentBindings: (agentId: string) => Promise<string[]>;
    addAgentBinding: (agentId: string, serverId: string) => Promise<void>;
    removeAgentBinding: (agentId: string, serverId: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    nexus: NexusAPI;
  }
}
