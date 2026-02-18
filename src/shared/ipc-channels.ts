export const IPC = {
  DB_GET_SESSIONS: 'db:get-sessions',
  DB_CREATE_SESSION: 'db:create-session',
  DB_GET_MESSAGES: 'db:get-messages',
  DB_SAVE_MESSAGE: 'db:save-message',
  DB_DELETE_SESSION: 'db:delete-session',
  DB_UPDATE_SESSION_TITLE: 'db:update-session-title',
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  APP_GET_PLATFORM: 'app:get-platform',
  // MCP channels
  MCP_GET_REGISTRY: 'mcp:get-registry',
  MCP_CONNECT: 'mcp:connect',
  MCP_DISCONNECT: 'mcp:disconnect',
  MCP_GET_ALL_STATUSES: 'mcp:get-all-statuses',
  MCP_LIST_TOOLS: 'mcp:list-tools',
  MCP_CALL_TOOL: 'mcp:call-tool',
  MCP_CONNECT_FOR_AGENT: 'mcp:connect-for-agent',
  MCP_ADD_SERVER: 'mcp:add-server',
  MCP_UPDATE_SERVER: 'mcp:update-server',
  MCP_REMOVE_SERVER: 'mcp:remove-server',
  // Auth channels
  AUTH_OPEN_LOGIN: 'auth:open-login',
  AUTH_CALLBACK: 'auth:callback',
  // Participant channels
  PARTICIPANTS_GET: 'db:get-participants',
  PARTICIPANTS_ADD: 'db:add-participant',
  PARTICIPANTS_REMOVE: 'db:remove-participant',
  // Copilot channels
  COPILOT_GET_MESSAGES: 'db:copilot-get-messages',
  COPILOT_SAVE_MESSAGE: 'db:copilot-save-message',
} as const;
