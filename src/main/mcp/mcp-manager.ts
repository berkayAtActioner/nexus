import { McpServerConfig, McpServerStatus, McpTool, McpConnectionStatus } from '../../shared/types';
import { loadRegistry } from './mcp-registry';
import { getUserMcpServers, saveUserMcpServer, deleteUserMcpServer } from '../store/mcp-servers';

// Dynamic imports for ESM-only MCP SDK
let ClientClass: any = null;
let StdioClientTransportClass: any = null;
let StreamableHTTPClientTransportClass: any = null;
let SSEClientTransportClass: any = null;
let ClientCredentialsProviderClass: any = null;

async function ensureSdkLoaded() {
  if (!ClientClass) {
    const clientMod = await import('@modelcontextprotocol/sdk/client/index.js');
    ClientClass = clientMod.Client || (clientMod as any).default?.Client;
    const stdioMod = await import('@modelcontextprotocol/sdk/client/stdio.js');
    StdioClientTransportClass = stdioMod.StdioClientTransport || (stdioMod as any).default?.StdioClientTransport;
    const httpMod = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
    StreamableHTTPClientTransportClass = httpMod.StreamableHTTPClientTransport || (httpMod as any).default?.StreamableHTTPClientTransport;
    const sseMod = await import('@modelcontextprotocol/sdk/client/sse.js');
    SSEClientTransportClass = sseMod.SSEClientTransport || (sseMod as any).default?.SSEClientTransport;
    const authMod = await import('@modelcontextprotocol/sdk/client/auth-extensions.js');
    ClientCredentialsProviderClass = authMod.ClientCredentialsProvider || (authMod as any).default?.ClientCredentialsProvider;

    console.log('[MCP SDK] Client:', typeof ClientClass);
    console.log('[MCP SDK] StdioTransport:', typeof StdioClientTransportClass);
    console.log('[MCP SDK] HTTPTransport:', typeof StreamableHTTPClientTransportClass);
    console.log('[MCP SDK] SSETransport:', typeof SSEClientTransportClass);
    console.log('[MCP SDK] CredentialsProvider:', typeof ClientCredentialsProviderClass);
  }
}

interface McpConnection {
  client: any;
  transport: any;
  tools: McpTool[];
  status: McpConnectionStatus;
  error?: string;
}

class McpManager {
  private registry: McpServerConfig[] = [];
  private connections: Map<string, McpConnection> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    const builtIn = loadRegistry();
    const userServers = getUserMcpServers();
    this.registry = [...builtIn, ...userServers];
    this.initialized = true;
    console.log(`[MCP Manager] Loaded ${builtIn.length} built-in + ${userServers.length} user server configs`);
  }

  getRegistry(): McpServerConfig[] {
    return this.registry;
  }

  getServerConfig(serverId: string): McpServerConfig | undefined {
    return this.registry.find(s => s.id === serverId);
  }

  async connect(serverId: string): Promise<void> {
    const config = this.getServerConfig(serverId);
    if (!config) throw new Error(`Unknown MCP server: ${serverId}`);

    const existing = this.connections.get(serverId);
    if (existing?.status === 'connected' || existing?.status === 'connecting') return;

    this.connections.set(serverId, {
      client: null,
      transport: null,
      tools: [],
      status: 'connecting',
    });

    try {
      await ensureSdkLoaded();

      let transport: any;

      if (config.transport === 'stdio') {
        transport = new StdioClientTransportClass({
          command: config.command!,
          args: config.args || [],
          env: { ...process.env, ...(config.env || {}) },
        });
      } else {
        // Build auth provider for OAuth client credentials
        let authProvider: any = undefined;
        if (config.authType === 'oauth_client_credentials' && config.oauthClientId && config.oauthClientSecret) {
          authProvider = new ClientCredentialsProviderClass({
            clientId: config.oauthClientId,
            clientSecret: config.oauthClientSecret,
            scope: config.oauthScope || undefined,
          });
        }

        // Build requestInit with custom headers
        const requestInit = config.headers && Object.keys(config.headers).length > 0
          ? { headers: config.headers }
          : undefined;

        const transportOpts: any = {};
        if (authProvider) transportOpts.authProvider = authProvider;
        if (requestInit) transportOpts.requestInit = requestInit;

        const serverUrl = new URL(config.url!);

        if (config.transport === 'http') {
          transport = new StreamableHTTPClientTransportClass(serverUrl, transportOpts);
        } else {
          transport = new SSEClientTransportClass(serverUrl, transportOpts);
        }
      }

      const client = new ClientClass(
        { name: 'nexus', version: '1.0.0' },
        { capabilities: {} }
      );

      await client.connect(transport);

      // Fetch tools
      const toolsResult = await client.listTools();
      const tools: McpTool[] = (toolsResult.tools || []).map((t: any) => ({
        name: t.name,
        description: t.description || '',
        inputSchema: t.inputSchema || {},
        serverId,
      }));

      this.connections.set(serverId, {
        client,
        transport,
        tools,
        status: 'connected',
      });

      console.log(`[MCP Manager] Connected to ${config.name} (${tools.length} tools)`);
    } catch (error: any) {
      console.error(`[MCP Manager] Failed to connect to ${serverId}:`, error.message);
      console.error(`[MCP Manager] Stack:`, error.stack);
      this.connections.set(serverId, {
        client: null,
        transport: null,
        tools: [],
        status: 'error',
        error: error.message,
      });
    }
  }

  async disconnect(serverId: string): Promise<void> {
    const conn = this.connections.get(serverId);
    if (!conn) return;

    try {
      if (conn.client) {
        await conn.client.close();
      }
    } catch (e) {
      // ignore close errors
    }

    this.connections.delete(serverId);
    console.log(`[MCP Manager] Disconnected from ${serverId}`);
  }

  async callTool(serverId: string, toolName: string, args: Record<string, unknown>): Promise<any> {
    const conn = this.connections.get(serverId);
    if (!conn || conn.status !== 'connected') {
      throw new Error(`MCP server ${serverId} not connected`);
    }

    const result = await conn.client.callTool({ name: toolName, arguments: args });
    return result;
  }

  listTools(serverId: string): McpTool[] {
    const conn = this.connections.get(serverId);
    return conn?.tools || [];
  }

  listAllTools(serverIds: string[]): McpTool[] {
    const tools: McpTool[] = [];
    for (const id of serverIds) {
      tools.push(...this.listTools(id));
    }
    return tools;
  }

  async connectForAgent(serverIds: string[]): Promise<void> {
    // Only connect servers that exist in the registry
    const validIds = serverIds.filter(id => this.getServerConfig(id));
    await Promise.all(validIds.map(id => this.connect(id)));
  }

  getStatus(serverId: string): McpServerStatus {
    const config = this.getServerConfig(serverId);
    const conn = this.connections.get(serverId);
    return {
      id: serverId,
      name: config?.name || serverId,
      icon: config?.icon || '?',
      status: conn?.status || 'disconnected',
      error: conn?.error,
      toolCount: conn?.tools.length,
    };
  }

  getAllStatuses(): McpServerStatus[] {
    return this.registry.map(s => this.getStatus(s.id));
  }

  async addServer(config: McpServerConfig): Promise<void> {
    saveUserMcpServer({ ...config, isUserDefined: true });
    // Remove any existing entry with same id then add
    this.registry = this.registry.filter(s => s.id !== config.id);
    this.registry.push({ ...config, isUserDefined: true });
    console.log(`[MCP Manager] Added user server: ${config.name}`);
  }

  async updateServer(config: McpServerConfig): Promise<void> {
    // Disconnect if currently connected
    await this.disconnect(config.id);
    saveUserMcpServer({ ...config, isUserDefined: true });
    this.registry = this.registry.map(s => s.id === config.id ? { ...config, isUserDefined: true } : s);
    console.log(`[MCP Manager] Updated user server: ${config.name}`);
  }

  async removeServer(serverId: string): Promise<void> {
    await this.disconnect(serverId);
    deleteUserMcpServer(serverId);
    this.registry = this.registry.filter(s => s.id !== serverId);
    console.log(`[MCP Manager] Removed user server: ${serverId}`);
  }

  async shutdown(): Promise<void> {
    for (const [id] of this.connections) {
      await this.disconnect(id);
    }
  }
}

export const mcpManager = new McpManager();
