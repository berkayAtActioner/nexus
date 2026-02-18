# Nexus — Product Requirements Document

## For Claude Code Implementation

**Version:** 1.0
**Date:** February 18, 2026
**Status:** Phase 1 Specification

---

## 1. Product Overview

### 1.1 What is Nexus?

Nexus is an Electron desktop application that combines AI-powered chat with team collaboration, where AI agents and humans are first-class participants in the same communication environment. Users interact with AI agents through natural conversation, and agents connect to external tools and data sources via the Model Context Protocol (MCP). When agents return structured data, it renders as interactive "MCP Apps" — rich UI components embedded in the conversation. Users can pin these apps to their sidebar for direct access, making Nexus their primary work surface.

### 1.2 Core Innovation

- **AI agents as peers**: Agents appear alongside humans in channels and DMs, with the same presence and @-mentionability, but always transparently marked as AI
- **MCP as the integration layer**: Instead of building integrations, Nexus connects to any MCP server. The AI orchestrates across multiple tools through natural language
- **MCP Apps**: When AI returns structured data (deals, tickets, analytics), it renders as interactive UI components — not just text. These can be pinned to the nav bar as standalone apps
- **Chat as launcher, nav bar as workspace**: Discover capabilities through conversation, pin the ones you use often

### 1.3 Phase 1 Scope

Phase 1 builds:
- AI agent conversations using the Anthropic Claude SDK
- MCP server integration framework (local stdio + remote SSE/HTTP)
- MCP Apps rendering system (interactive UI components in chat + standalone views)
- Lightweight Node/Express backend for auth, user management, and agent config
- OAuth authentication (Google, GitHub)
- Electron desktop app shell

Phase 1 does **NOT** build:
- Full team chat with Stream (channels, human DMs) — Phase 2
- Multi-user AI sessions (inviting humans into agent DMs) — Phase 2
- Side panel copilot for channels — Phase 2

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Electron App                       │
│  ┌───────────────────────────────────────────────┐  │
│  │              React Frontend                    │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ Chat UI │ │ MCP Apps │ │ Agent Config  │  │  │
│  │  └────┬────┘ └────┬─────┘ └───────┬───────┘  │  │
│  │       │           │               │           │  │
│  │  ┌────┴───────────┴───────────────┴────────┐  │  │
│  │  │         State Management (Zustand)       │  │  │
│  │  └────┬───────────┬───────────────┬────────┘  │  │
│  └───────┼───────────┼───────────────┼───────────┘  │
│          │           │               │              │
│  ┌───────┴──┐  ┌─────┴─────┐  ┌─────┴──────────┐  │
│  │ Claude   │  │ MCP Client│  │  Electron Main  │  │
│  │ SDK      │  │ Manager   │  │  Process        │  │
│  │(Renderer)│  │ (Main)    │  │  (IPC Bridge)   │  │
│  └──────────┘  └─────┬─────┘  └────────────────  │  │
│                      │                            │  │
│         ┌────────────┼────────────┐               │  │
│         │            │            │               │  │
│    ┌────┴───┐  ┌─────┴───┐  ┌────┴────┐         │  │
│    │ Local  │  │ Remote  │  │ Remote  │         │  │
│    │ MCP    │  │ MCP     │  │ MCP     │         │  │
│    │(stdio) │  │(SSE)    │  │(HTTP)   │         │  │
│    └────────┘  └─────────┘  └─────────┘         │  │
└─────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────┐
│   Node/Express        │
│   Backend             │
│  ┌─────────────────┐  │
│  │ Auth (OAuth)     │  │
│  │ User Management  │  │
│  │ Agent Config     │  │
│  │ Session Store    │  │
│  └─────────────────┘  │
└───────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Shell | Electron (electron-forge) | Cross-platform desktop app |
| Frontend | React 18 + TypeScript | UI framework |
| Styling | Tailwind CSS | Utility-first styling |
| State Management | Zustand | Lightweight, TypeScript-first state |
| AI SDK | @anthropic-ai/sdk | Claude API interactions |
| MCP Client | @modelcontextprotocol/sdk | MCP server connections |
| Backend | Node.js + Express + TypeScript | Auth, config, sessions |
| Database | SQLite (via better-sqlite3) | Local data persistence |
| Auth | Passport.js + OAuth 2.0 | Google, GitHub authentication |
| IPC | Electron IPC (contextBridge) | Main ↔ Renderer communication |

### 2.3 Project Structure

```
nexus/
├── package.json
├── electron-forge.config.ts
├── tsconfig.json
├── tailwind.config.ts
│
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # App entry, window management
│   │   ├── ipc-handlers.ts            # IPC handler registration
│   │   ├── mcp/
│   │   │   ├── mcp-manager.ts         # MCP connection lifecycle
│   │   │   ├── local-transport.ts     # stdio transport for local servers
│   │   │   ├── remote-transport.ts    # SSE/HTTP transport for remote servers
│   │   │   └── mcp-registry.ts        # Registry of available MCP servers
│   │   ├── store/
│   │   │   ├── db.ts                  # SQLite database init + migrations
│   │   │   ├── sessions.ts            # Chat session persistence
│   │   │   └── settings.ts            # User preferences
│   │   └── auth/
│   │       └── token-manager.ts       # Secure token storage (keytar)
│   │
│   ├── renderer/                      # React app
│   │   ├── index.html
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── ActivityBar.tsx     # Left icon strip
│   │   │   │   ├── Sidebar.tsx         # Channel/people/agent lists
│   │   │   │   ├── MainPanel.tsx       # Message area wrapper
│   │   │   │   ├── Header.tsx          # Context-aware top bar
│   │   │   │   └── SidePanel.tsx       # Copilot side panel
│   │   │   ├── chat/
│   │   │   │   ├── ChatView.tsx        # Agent DM conversation view
│   │   │   │   ├── MessageBubble.tsx   # Individual message rendering
│   │   │   │   ├── ComposeBar.tsx      # Message input with agent shortcuts
│   │   │   │   ├── StreamingMessage.tsx # Animated token streaming
│   │   │   │   └── SystemMessage.tsx   # Join/leave/status messages
│   │   │   ├── agents/
│   │   │   │   ├── AgentList.tsx        # Sidebar agent list
│   │   │   │   ├── AgentAvatar.tsx      # Avatar with ⚡ badge
│   │   │   │   ├── SessionPicker.tsx    # Session dropdown
│   │   │   │   └── McpConfigModal.tsx   # MCP server toggle panel
│   │   │   ├── mcp-apps/
│   │   │   │   ├── McpAppRenderer.tsx   # Dynamic app component loader
│   │   │   │   ├── AppPinButton.tsx     # Pin-to-sidebar affordance
│   │   │   │   ├── AppFullView.tsx      # Standalone app view
│   │   │   │   └── registry/
│   │   │   │       ├── index.ts         # App component registry
│   │   │   │       ├── DataTable.tsx    # Generic sortable table
│   │   │   │       ├── DetailView.tsx   # Generic detail layout
│   │   │   │       ├── FormView.tsx     # Generic form renderer
│   │   │   │       └── ChartView.tsx    # Generic chart renderer
│   │   │   └── shared/
│   │   │       ├── HoverToolbar.tsx     # Floating action bar
│   │   │       ├── StatusDot.tsx
│   │   │       └── ConnectionPills.tsx  # MCP status indicators
│   │   ├── stores/
│   │   │   ├── chat-store.ts           # Messages, sessions
│   │   │   ├── agent-store.ts          # Agent configs, MCP bindings
│   │   │   ├── mcp-store.ts            # MCP connection states
│   │   │   ├── app-store.ts            # Pinned apps, app view state
│   │   │   └── auth-store.ts           # User session
│   │   ├── services/
│   │   │   ├── claude-service.ts       # Claude API wrapper
│   │   │   ├── mcp-bridge.ts           # Renderer → Main MCP calls via IPC
│   │   │   └── api-client.ts           # Backend API client
│   │   ├── hooks/
│   │   │   ├── useAgent.ts
│   │   │   ├── useMcpTools.ts
│   │   │   ├── useChat.ts
│   │   │   └── useStreamingResponse.ts
│   │   └── types/
│   │       ├── agent.ts
│   │       ├── chat.ts
│   │       ├── mcp.ts
│   │       └── app.ts
│   │
│   ├── shared/                        # Shared between main + renderer
│   │   ├── ipc-channels.ts            # IPC channel name constants
│   │   └── types.ts                   # Shared type definitions
│   │
│   └── preload/
│       └── index.ts                   # contextBridge API exposure
│
├── server/                            # Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                   # Express app entry
│   │   ├── routes/
│   │   │   ├── auth.ts                # OAuth routes
│   │   │   ├── users.ts               # User profile
│   │   │   └── agents.ts              # Agent CRUD (reads config)
│   │   ├── middleware/
│   │   │   └── auth.ts                # JWT verification
│   │   ├── services/
│   │   │   ├── auth-service.ts        # OAuth + JWT token management
│   │   │   └── agent-config.ts        # Reads/validates agent YAML
│   │   └── db/
│   │       ├── schema.sql
│   │       └── database.ts            # SQLite setup
│   └── agents.yml                     # Agent definitions (see §4)
│
└── mcp-servers/                       # Mock MCP servers for development
    └── actioner-mock/
        ├── package.json
        ├── src/
        │   └── index.ts               # Mock Actioner MCP server
        └── README.md
```

### 2.4 Electron Process Model

**Main Process** handles:
- MCP server lifecycle (spawn local servers, maintain SSE connections)
- SQLite database operations
- Secure credential storage (keytar)
- File system access
- Window management

**Renderer Process** handles:
- React UI rendering
- Claude SDK API calls (direct HTTPS — no need to proxy through main)
- State management
- MCP tool calls via IPC bridge to main process

**Preload Script** exposes:
```typescript
// preload/index.ts
contextBridge.exposeInMainWorld('nexus', {
  mcp: {
    listServers: () => ipcRenderer.invoke('mcp:list-servers'),
    connectServer: (id: string) => ipcRenderer.invoke('mcp:connect', id),
    disconnectServer: (id: string) => ipcRenderer.invoke('mcp:disconnect', id),
    callTool: (serverId: string, tool: string, args: any) =>
      ipcRenderer.invoke('mcp:call-tool', serverId, tool, args),
    listTools: (serverId: string) => ipcRenderer.invoke('mcp:list-tools', serverId),
    onServerStatus: (cb: (event: McpStatusEvent) => void) =>
      ipcRenderer.on('mcp:status', (_, event) => cb(event)),
  },
  auth: {
    getToken: () => ipcRenderer.invoke('auth:get-token'),
    setToken: (token: string) => ipcRenderer.invoke('auth:set-token', token),
    clearToken: () => ipcRenderer.invoke('auth:clear-token'),
  },
  db: {
    getSessions: (agentId: string) => ipcRenderer.invoke('db:get-sessions', agentId),
    saveMessage: (msg: ChatMessage) => ipcRenderer.invoke('db:save-message', msg),
    getMessages: (sessionId: string) => ipcRenderer.invoke('db:get-messages', sessionId),
  },
  app: {
    getPlatform: () => ipcRenderer.invoke('app:get-platform'),
  }
});
```

---

## 3. MCP Integration Framework

### 3.1 MCP Manager (Main Process)

The MCP Manager lives in the Electron main process and manages all MCP server connections.

```typescript
// src/main/mcp/mcp-manager.ts

interface McpServerConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  transport: 'stdio' | 'sse' | 'http';

  // For stdio (local servers)
  command?: string;        // e.g., "npx"
  args?: string[];         // e.g., ["-y", "@actioner/mcp-server"]
  env?: Record<string, string>;

  // For SSE/HTTP (remote servers)
  url?: string;            // e.g., "https://mcp.actioner.com/sse"
  headers?: Record<string, string>;  // Auth headers

  // Metadata
  category: string;        // "crm", "dev", "docs", etc.
  requiresAuth?: boolean;
  authType?: 'api-key' | 'oauth' | 'token';
}

class McpManager {
  private connections: Map<string, McpConnection>;
  private registry: McpServerConfig[];

  async connect(serverId: string): Promise<void>;
  async disconnect(serverId: string): Promise<void>;
  async callTool(serverId: string, toolName: string, args: any): Promise<ToolResult>;
  async listTools(serverId: string): Promise<Tool[]>;
  async listResources(serverId: string): Promise<Resource[]>;
  async readResource(serverId: string, uri: string): Promise<ResourceContent>;
  getStatus(serverId: string): 'connected' | 'connecting' | 'disconnected' | 'error';
  getAllStatuses(): Map<string, ConnectionStatus>;
}
```

### 3.2 MCP Server Registry

Servers are configured in a YAML file that can be extended by users:

```yaml
# config/mcp-servers.yml

servers:
  - id: actioner-crm
    name: Actioner CRM
    icon: "⬢"
    description: "Deals, contacts, pipeline, activities"
    transport: sse
    url: "${ACTIONER_MCP_URL}"
    headers:
      Authorization: "Bearer ${ACTIONER_API_KEY}"
    category: crm
    requiresAuth: true
    authType: api-key

  - id: github
    name: GitHub
    icon: "⟐"
    description: "Repos, PRs, issues, code search"
    transport: stdio
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "${GITHUB_TOKEN}"
    category: dev
    requiresAuth: true
    authType: token

  - id: google-drive
    name: Google Drive
    icon: "△"
    description: "Docs, sheets, slides"
    transport: stdio
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-gdrive"]
    category: docs
    requiresAuth: true
    authType: oauth

  - id: web-search
    name: Web Search
    icon: "◎"
    description: "Search the public web"
    transport: stdio
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-brave-search"]
    env:
      BRAVE_API_KEY: "${BRAVE_API_KEY}"
    category: general

  - id: filesystem
    name: "Local Files"
    icon: "📁"
    description: "Read and write local files"
    transport: stdio
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}/Documents"]
    category: general
```

### 3.3 Claude + MCP Tool Use Flow

When a user sends a message to an agent, the system:

1. Collects all tools from the agent's enabled MCP servers
2. Sends the message to Claude with the tools as function definitions
3. If Claude responds with a tool_use block, routes the call to the appropriate MCP server
4. Returns the tool result to Claude for the next turn
5. Continues until Claude responds with text (possibly containing structured MCP App data)

```typescript
// src/renderer/services/claude-service.ts

class ClaudeService {
  private client: Anthropic;

  async sendMessage(params: {
    agentConfig: AgentConfig;
    messages: Message[];
    mcpTools: Tool[];          // Collected from enabled MCP servers
    onToken: (token: string) => void;  // Streaming callback
    onToolCall: (call: ToolCall) => Promise<ToolResult>;  // MCP bridge
    onMcpApp: (app: McpAppData) => void;  // When response contains app data
  }): Promise<AssistantMessage> {

    const response = await this.client.messages.create({
      model: params.agentConfig.model,
      max_tokens: 4096,
      system: params.agentConfig.systemPrompt,
      messages: params.messages,
      tools: params.mcpTools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
      stream: true,
    });

    // Handle streaming response
    for await (const event of response) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          params.onToken(event.delta.text);
        }
      }
      if (event.type === 'content_block_stop') {
        // Check if the block was a tool_use
        if (currentBlock.type === 'tool_use') {
          const result = await params.onToolCall({
            serverId: this.resolveServer(currentBlock.name),
            tool: currentBlock.name,
            args: currentBlock.input,
          });
          // Continue conversation with tool result
          // (recursive call with tool_result message appended)
        }
      }
    }
  }
}
```

### 3.4 Actioner MCP Server Interface

Since the Actioner MCP server is being built in parallel, here is the interface contract it should implement:

```typescript
// Actioner MCP Server — Expected Tools

// ── Deals ──
tool: "actioner_list_deals"
  input: { filter?: "active" | "won" | "lost" | "all", owner?: string, stage?: string, limit?: number }
  output: { deals: Deal[], total: number, pipeline_value: string }

tool: "actioner_get_deal"
  input: { deal_id: string }
  output: { deal: DealDetail }  // includes contacts, timeline, notes, next_steps

tool: "actioner_update_deal"
  input: { deal_id: string, updates: Partial<Deal> }
  output: { deal: Deal, changes: string[] }

tool: "actioner_get_deal_timeline"
  input: { deal_id: string, limit?: number }
  output: { events: TimelineEvent[] }

// ── Contacts ──
tool: "actioner_list_contacts"
  input: { deal_id?: string, company?: string, search?: string }
  output: { contacts: Contact[] }

tool: "actioner_get_contact"
  input: { contact_id: string }
  output: { contact: ContactDetail }  // includes communication history

// ── Activities ──
tool: "actioner_list_activities"
  input: { deal_id?: string, contact_id?: string, type?: "email" | "call" | "meeting" | "note", limit?: number }
  output: { activities: Activity[] }

// ── Pipeline ──
tool: "actioner_get_pipeline_summary"
  input: { period?: string }  // "this_month", "this_quarter", etc.
  output: { summary: PipelineSummary }  // stages, totals, forecast

// ── MCP App Hints ──
// The tool output should include an optional `_app` field that tells Nexus
// how to render the data as an MCP App:
{
  deals: [...],
  _app: {
    type: "data-table",          // Component type to render
    title: "Active Deals",
    columns: ["name", "value", "stage", "close_date", "probability"],
    row_action: {                // What happens when a row is clicked
      tool: "actioner_get_deal",
      args_from_row: { deal_id: "id" },
      render_as: "detail-view"
    },
    pinnable: {                  // Allow pinning as a sidebar app
      app_id: "actioner-deals",
      name: "Deals",
      icon: "⬢",
      color: "#22c55e"
    }
  }
}
```

### 3.5 Mock Actioner MCP Server

Build a mock MCP server for development that returns realistic data:

```typescript
// mcp-servers/actioner-mock/src/index.ts

// Implements the MCP protocol using @modelcontextprotocol/sdk
// Returns hardcoded but realistic deal, contact, and activity data
// Supports all tools defined in §3.4
// Includes _app hints in tool outputs for MCP App rendering
// Runs via stdio transport: npx tsx mcp-servers/actioner-mock/src/index.ts
```

---

## 4. Agent Configuration

### 4.1 Agent Definition File

Agents are defined in a YAML configuration file:

```yaml
# server/agents.yml

agents:
  - id: nexus
    name: Nexus
    role: General Assistant
    avatar: "✦"
    color: "#8b5cf6"
    isGeneral: true
    model: claude-sonnet-4-20250514
    systemPrompt: |
      You are Nexus, a general-purpose AI assistant. You help users with any task
      by leveraging the tools and data sources available to you. When you return
      structured data from tools, include rendering hints so the UI can display
      rich interactive components.

      When returning data that should render as a table, include an _app field
      in your response with type "data-table" and appropriate column/action config.

      When returning detail data, use type "detail-view" with sections config.

      Always cite which tool/source you used to get the data.
    mcpServers:
      - actioner-crm
      - google-drive
      - web-search
      - filesystem
    temperature: 0.7
    maxTokens: 4096

  - id: atlas
    name: Atlas
    role: Research & Analysis
    avatar: "◈"
    color: "#6366f1"
    isGeneral: false
    model: claude-sonnet-4-20250514
    systemPrompt: |
      You are Atlas, a research and analysis specialist. You excel at finding
      data, synthesizing information from multiple sources, and providing
      data-driven insights. You have access to CRM data, analytics tools,
      and web search.
    mcpServers:
      - actioner-crm
      - web-search
      - google-drive
    temperature: 0.5
    maxTokens: 8192

  - id: muse
    name: Muse
    role: Writing & Creative
    avatar: "◎"
    color: "#ec4899"
    isGeneral: false
    model: claude-sonnet-4-20250514
    systemPrompt: |
      You are Muse, a writing and creative specialist. You help with drafting
      emails, documents, presentations, and creative content. You can access
      documents and files to use as reference material.
    mcpServers:
      - google-drive
      - filesystem
      - web-search
    temperature: 0.8
    maxTokens: 4096

  - id: forge
    name: Forge
    role: Code & Engineering
    avatar: "⬡"
    color: "#f59e0b"
    isGeneral: false
    model: claude-sonnet-4-20250514
    systemPrompt: |
      You are Forge, a code and engineering specialist. You help with code
      review, debugging, architecture decisions, and technical documentation.
      You have access to GitHub repos, Jira tickets, and infrastructure tools.
    mcpServers:
      - github
      - filesystem
    temperature: 0.3
    maxTokens: 8192
```

### 4.2 Runtime Agent MCP Overrides

Users can enable/disable MCP servers per agent at runtime. These overrides are stored locally in SQLite:

```sql
CREATE TABLE agent_mcp_overrides (
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  mcp_server_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, agent_id, mcp_server_id)
);
```

---

## 5. MCP Apps Rendering System

### 5.1 How MCP Apps Work

When Claude calls an MCP tool and the result includes an `_app` field, the frontend renders an interactive component instead of (or in addition to) plain text. The `_app` field is a rendering hint — it tells the frontend what component to use and how to configure it.

### 5.2 App Component Types

```typescript
// src/renderer/types/app.ts

type McpAppType = 'data-table' | 'detail-view' | 'form-view' | 'chart-view' | 'custom';

interface McpAppData {
  type: McpAppType;
  title: string;
  source: string;           // e.g., "Actioner CRM"

  // For data-table
  columns?: ColumnDef[];
  data?: any[];
  sortable?: boolean;
  row_action?: {
    tool: string;            // MCP tool to call on click
    args_from_row: Record<string, string>;  // Map row fields to tool args
    render_as: McpAppType;   // How to render the result
  };

  // For detail-view
  sections?: SectionDef[];
  header?: HeaderDef;

  // For chart-view
  chartType?: 'bar' | 'line' | 'pie' | 'funnel';
  chartData?: any;

  // Pinning
  pinnable?: {
    app_id: string;
    name: string;
    icon: string;
    color: string;
  };

  // Actions
  actions?: AppAction[];     // Buttons shown below the app
}

interface AppAction {
  label: string;             // e.g., "📤 Post to channel"
  type: 'tool_call' | 'navigate' | 'copy' | 'download';
  tool?: string;
  args?: any;
  target?: string;           // For navigate: channel ID, app ID, etc.
}

interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'currency' | 'badge' | 'date' | 'trend';
  sortable?: boolean;
  color_map?: Record<string, string>;  // For badge type: value → color
}
```

### 5.3 McpAppRenderer

The central component that maps `_app.type` to the right React component:

```typescript
// src/renderer/components/mcp-apps/McpAppRenderer.tsx

interface McpAppRendererProps {
  appData: McpAppData;
  compact?: boolean;           // true when inline in chat, false when standalone
  onAction?: (action: AppAction) => void;
  onPin?: (pinConfig: PinConfig) => void;
  onDrilldown?: (toolCall: ToolCallRequest) => void;
}

// Maps type → component:
// 'data-table'  → <DataTable />
// 'detail-view' → <DetailView />
// 'chart-view'  → <ChartView />
// 'form-view'   → <FormView />
// 'custom'      → dynamic component loading (future)
```

### 5.4 Inline vs. Standalone Rendering

MCP Apps render in two contexts:

**Inline (in chat):** Compact variant, embedded in a message bubble. Shows a subset of data with a "Open full view →" link. Clicking drills down (triggers another tool call) or opens the standalone view.

**Standalone (pinned app view):** Full-width view with its own sidebar navigation. The sidebar shows filters, views, and stages. The main area renders the full app component.

### 5.5 App Pinning

When an MCP App response includes `pinnable`, show a pin affordance. Pinning adds the app to the activity bar below the divider. Pinned apps are stored locally:

```sql
CREATE TABLE pinned_apps (
  user_id TEXT NOT NULL,
  app_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  source TEXT NOT NULL,
  mcp_server_id TEXT NOT NULL,
  default_tool TEXT NOT NULL,     -- Tool to call when opening the app
  default_args TEXT,              -- JSON args for the default tool call
  position INTEGER NOT NULL,     -- Order in activity bar
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

When a user clicks a pinned app:
1. Set `activeView` to app mode
2. Call the `default_tool` on the associated MCP server
3. Render the result using McpAppRenderer in standalone mode
4. Show the app's sidebar navigation (derived from available tools on the same server)

---

## 6. UI Design Specification

### 6.1 Layout

Three-column layout with optional side panel:

```
┌──────┬───────────┬──────────────────────────────┬─────────────┐
│      │           │         Header (52px)         │             │
│  56  │   232px   ├──────────────────────────────┤   340px      │
│  px  │           │                              │   (optional) │
│      │  Sidebar  │       Main Content           │  Side Panel  │
│ Act  │           │                              │  (Copilot)   │
│ Bar  │           │                              │             │
│      │           │                              │             │
│      │           ├──────────────────────────────┤             │
│      │           │      Compose Bar             │             │
└──────┴───────────┴──────────────────────────────┴─────────────┘
```

### 6.2 Visual Design Tokens

```typescript
const theme = {
  colors: {
    bg: {
      primary: '#0f0f1a',      // Main background
      secondary: '#12121f',     // Sidebar
      tertiary: '#0a0a14',      // Activity bar
      elevated: '#161625',      // Cards, compose bar
      hover: '#1e1e36',         // Hover states
    },
    border: {
      default: '#1a1a2e',
      subtle: '#2a2a44',
      dashed: '#3a3a50',
    },
    text: {
      primary: '#e2e2ee',
      secondary: '#9999aa',
      tertiary: '#5a5a70',
      muted: '#3a3a50',
    },
    accent: {
      purple: '#8b5cf6',        // Nexus / General
      indigo: '#6366f1',        // Atlas
      pink: '#ec4899',          // Muse
      amber: '#f59e0b',         // Forge
      green: '#22c55e',         // Actioner / success
    },
    status: {
      online: '#22c55e',
      away: '#f59e0b',
      offline: '#6b7280',
    },
  },
  font: {
    family: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    sizes: { xs: 10.5, sm: 11.5, base: 13.5, lg: 14.5, xl: 16, '2xl': 20 },
  },
  radius: { sm: 6, md: 8, lg: 10, xl: 12, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24 },
};
```

### 6.3 Component Specifications

**Agent Avatar:**
- 28-34px rounded square (radius 7-8)
- Background: agent color at 22% opacity
- Icon: agent avatar character in agent color
- ⚡ badge: 12-14px square, positioned bottom-right, solid agent color background
- General agent (Nexus): gradient background instead of transparent

**Message Bubbles (Agent DM):**
- User messages: right-aligned, `#2a2a50` background, top-right radius: 4px
- Agent messages: left-aligned, `#161625` background, top-left radius: 4px
- Other users' messages (invited): right-aligned, `#252540` background, sender name label above
- System messages (joins): centered divider with pill label

**MCP App Inline (in chat):**
- Full width of message area
- Border: 1px solid `#2a2a44`, radius 12
- Header with source icon, title, count badge
- Footer with "via [Source]" label and "Open full view →" link
- Max height when inline: 400px with scroll

**Hover Toolbar:**
- Appears on mouse enter, positioned absolute top-right of parent
- Background: `#1e1e36`, border: `#2a2a44`, radius 8
- Shadow: `0 4px 16px rgba(0,0,0,0.4)`
- Icons: 30×28px hit area, 5px radius, hover bg: `#2a2a44`

**Connection Pills (header):**
- 24×24px rounded square per MCP server
- Background: server/agent color at 12% opacity
- Border: server/agent color at 28% opacity
- ⚙ button: dashed border, opens McpConfigModal

---

## 7. Data Models

### 7.1 Database Schema (SQLite)

```sql
-- User data
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  provider TEXT NOT NULL,         -- 'google', 'github'
  provider_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat sessions with agents
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,              -- 'user', 'assistant', 'system', 'tool_call', 'tool_result'
  sender_name TEXT,                -- For multi-user sessions (Phase 2)
  content TEXT NOT NULL,           -- Text content
  mcp_app_data TEXT,              -- JSON: McpAppData if message contains an app
  attachments TEXT,                -- JSON: file attachments
  tool_calls TEXT,                 -- JSON: tool use blocks from Claude
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
);

-- Agent MCP overrides
CREATE TABLE agent_mcp_overrides (
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  mcp_server_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, agent_id, mcp_server_id)
);

-- Pinned apps
CREATE TABLE pinned_apps (
  user_id TEXT NOT NULL,
  app_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  source TEXT NOT NULL,
  mcp_server_id TEXT NOT NULL,
  default_tool TEXT NOT NULL,
  default_args TEXT,
  position INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MCP server credentials
CREATE TABLE mcp_credentials (
  user_id TEXT NOT NULL,
  server_id TEXT NOT NULL,
  credential_type TEXT NOT NULL,   -- 'api-key', 'oauth-token', 'token'
  encrypted_value TEXT NOT NULL,   -- Encrypted at rest
  PRIMARY KEY (user_id, server_id)
);

-- User settings
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'dark',
  sidebar_width INTEGER DEFAULT 232,
  pinned_app_order TEXT,           -- JSON array of app IDs
  last_active_view TEXT,           -- JSON: last activeView state
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 7.2 TypeScript Types

```typescript
// src/shared/types.ts

interface AgentConfig {
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

interface ChatSession {
  id: string;
  userId: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool_call' | 'tool_result';
  senderName?: string;
  content: string;
  mcpAppData?: McpAppData;
  attachments?: Attachment[];
  toolCalls?: ToolCallBlock[];
  createdAt: string;
}

interface McpServerStatus {
  id: string;
  name: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  toolCount: number;
  error?: string;
  lastConnected?: string;
}

interface PinnedApp {
  userId: string;
  appId: string;
  name: string;
  icon: string;
  color: string;
  source: string;
  mcpServerId: string;
  defaultTool: string;
  defaultArgs?: any;
  position: number;
}
```

---

## 8. Backend API

### 8.1 Routes

```
POST   /auth/google          → OAuth Google login
POST   /auth/github          → OAuth GitHub login
POST   /auth/refresh         → Refresh JWT token
POST   /auth/logout          → Invalidate session

GET    /api/me               → Current user profile
PATCH  /api/me               → Update profile

GET    /api/agents           → List all agents (from agents.yml)
GET    /api/agents/:id       → Get agent config
GET    /api/agents/:id/mcps  → Get user's MCP overrides for agent
PUT    /api/agents/:id/mcps  → Update MCP overrides
```

### 8.2 Auth Flow

1. User clicks "Sign in with Google/GitHub" in the Electron app
2. Electron opens a BrowserWindow to `http://localhost:3001/auth/google`
3. Passport.js handles OAuth redirect flow
4. On success, backend returns JWT token
5. Electron stores JWT in system keychain (via keytar)
6. All subsequent API requests include `Authorization: Bearer <jwt>`
7. Claude API calls use the user's Anthropic API key (stored in settings, encrypted)

---

## 9. Implementation Plan

### Phase 1A: Foundation (Week 1-2)

**Goal:** Electron app running with basic agent chat.

1. **Scaffold Electron + React project**
   - electron-forge with webpack/TypeScript template
   - Tailwind CSS setup
   - Project structure as defined in §2.3

2. **Backend setup**
   - Express server with TypeScript
   - SQLite database with schema from §7.1
   - OAuth routes (Google + GitHub) with Passport.js
   - JWT token management
   - Agent config loader (reads agents.yml)

3. **Core UI shell**
   - Activity bar with section icons
   - Sidebar with agent list (reads from backend)
   - Header component (context-aware)
   - Three-column layout with responsive sizing
   - Dark theme with design tokens from §6.2

4. **Basic agent chat**
   - Claude SDK integration in renderer
   - Streaming message display
   - Session management (create, list, switch)
   - Message persistence to SQLite
   - Compose bar with send button

### Phase 1B: MCP Integration (Week 3-4)

**Goal:** Agents can use MCP tools, results render as rich components.

5. **MCP Manager (main process)**
   - McpManager class with connect/disconnect lifecycle
   - stdio transport for local MCP servers
   - SSE transport for remote MCP servers
   - IPC bridge for renderer → main MCP calls
   - Server status tracking and error handling

6. **MCP Server Registry**
   - YAML config loader
   - Server list in UI
   - Connection status indicators (pills in header)

7. **Claude + MCP tool loop**
   - Collect tools from agent's enabled MCP servers
   - Send tools to Claude API
   - Handle tool_use responses
   - Route tool calls through MCP Manager
   - Multi-turn tool use (agent calls tool, gets result, continues)

8. **Mock Actioner MCP server**
   - Implement all tools from §3.4
   - Realistic deal/contact/activity data
   - Include `_app` rendering hints in responses

### Phase 1C: MCP Apps (Week 5-6)

**Goal:** Rich interactive components render from MCP data.

9. **MCP App renderer**
   - McpAppRenderer component with type → component mapping
   - DataTable component (sortable, clickable rows)
   - DetailView component (header, sections, timeline)
   - ChartView component (basic bar/line charts)
   - Inline (compact) vs. standalone rendering modes

10. **App drilldown**
    - Clicking a table row triggers another tool call
    - Result renders as a new message with detail view
    - "Open full view" link transitions to standalone mode

11. **App pinning**
    - Pin button on pinnable MCP App responses
    - Pinned apps appear in activity bar
    - Clicking pinned app → standalone view with sidebar nav
    - Pin persistence in SQLite

12. **MCP Config Modal**
    - Full modal with search, toggle switches
    - Active vs. available server grouping
    - Per-agent MCP overrides saved to database
    - Real-time connection status

### Phase 1D: Polish (Week 7-8)

13. **Agent config management**
    - Settings page to enter API keys (Anthropic, MCP servers)
    - MCP server credential management (encrypted storage)
    - Agent selector with proper visual design

14. **Session management**
    - Session picker dropdown
    - Create new session
    - Session title auto-generation (first message summary)
    - Session list in sidebar when viewing agent

15. **Quality and performance**
    - Error handling for MCP connection failures
    - Retry logic for failed tool calls
    - Loading states for all async operations
    - Keyboard shortcuts (Cmd+N new session, Cmd+K command palette)
    - Electron auto-updater setup

---

## 10. Key Design Principles

1. **Human stays in control.** AI never acts autonomously — every tool call is visible, every action is traceable. The user can see which MCP servers are active and what tools were called.

2. **Chat as launcher, nav as workspace.** Users discover capabilities through conversation. When something is useful enough to revisit, they pin it. The nav bar evolves from static to personalized.

3. **Transparency about AI.** Agent messages are always visually distinct (colored name, AI badge, ⚡ indicator). Tool calls and data sources are attributed. Never ambiguous about what's human vs. AI.

4. **MCP Apps are data-driven, not hardcoded.** The rendering system is generic — it reads `_app` hints from tool outputs and maps them to generic components. Adding a new MCP server should automatically produce rich UI without frontend changes.

5. **Progressive disclosure.** Simple things (chatting with an agent) should be immediately obvious. Advanced things (configuring MCP servers, managing sessions) are accessible but don't clutter the default experience.

---

## 11. Reference UI Prototype

A working React prototype exists that demonstrates all UI patterns described in this document. It is available as `nexus prototype.jsx` and can be rendered in any React environment. It demonstrates:

- Activity bar with section navigation + pinned apps
- Sidebar with channels, people, and agents (general + specialists)
- Agent DM with session picker, MCP connection pills, participant avatars, and invite picker
- Inline MCP App rendering (deals table, deal detail card) within chat messages
- MCP App drilldown (clicking a table row triggers detail view in chat)
- Standalone app view (full-screen deals with sidebar navigation)
- MCP Config Modal with search, toggle switches, active/available grouping
- Cross-tool workflow simulation (fetch data → generate file → post to channel)
- Pin-to-sidebar flow with toast confirmation
- Channel view with inline AI responses and hover toolbars
- Side panel copilot with quick actions and hover toolbar

Use this prototype as the visual reference for implementing all components. The design tokens, spacing, colors, and interaction patterns in the prototype are authoritative.
