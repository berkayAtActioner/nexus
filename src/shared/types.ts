export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  isGeneral: boolean;
  model: string;
  systemPrompt: string;
  mcpServers: string[];
  temperature: number;
  maxTokens: number;
}

export interface ChatSession {
  id: string;
  user_id: string;
  agent_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  sender_name: string | null;
  content: string;
  mcp_app_data: string | null;
  attachments: string | null;
  tool_calls: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  theme: string;
  sidebar_width: number;
  api_key: string | null;
  pinned_app_order: string | null;
  last_active_view: string | null;
}

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
}

// MCP Types

export type McpTransportType = 'stdio' | 'sse' | 'http';

export interface McpServerConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  transport: McpTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  category: string;
  isUserDefined?: boolean;
  authType?: 'none' | 'oauth_client_credentials';
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthScope?: string;
}

export type McpConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface McpServerStatus {
  id: string;
  name: string;
  icon: string;
  status: McpConnectionStatus;
  error?: string;
  toolCount?: number;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

export interface McpAppData {
  type: 'DataTable' | 'DetailView' | 'ChartView';
  pinnable: boolean;
  title: string;
  data: any;
  serverId: string;
  toolName: string;
}

export interface PinnedApp {
  id: string;
  title: string;
  icon: string;
  color: string;
  appData: McpAppData;
}

export interface ToolCallDisplay {
  id: string;
  toolName: string;
  serverId: string;
  args: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  duration?: number;
  appData?: McpAppData;
}

// Auth / Collaboration types

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  online?: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  streamToken: string;
}

export interface StreamConfig {
  configured: boolean;
  apiKey?: string;
}

export interface SessionParticipant {
  session_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface CopilotMessage {
  id: string;
  user_id: string;
  agent_id: string;
  context_type: 'channel' | 'dm';
  context_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
