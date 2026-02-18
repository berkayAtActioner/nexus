# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexus is an Electron desktop application combining AI-powered chat with team collaboration. AI agents and humans are first-class participants in conversations. Agents connect to external tools via MCP (Model Context Protocol), and structured data from agents renders as interactive "MCP Apps" — rich UI components embedded in chat that can be pinned to the sidebar as standalone apps.

**Current state:** Pre-implementation. The repo contains `nexus-prd.md` (full specification) and `nexus-prototype.jsx` (authoritative visual/interaction reference). All implementation follows from these two files.

## Technology Stack

- **Desktop Shell:** Electron (electron-forge)
- **Frontend:** React 18 + TypeScript, Tailwind CSS, Zustand (state)
- **AI:** @anthropic-ai/sdk (Claude) — calls made directly from renderer (HTTPS)
- **MCP:** @modelcontextprotocol/sdk — managed in Electron main process
- **Backend:** Node.js + Express + TypeScript (port 3001) — auth, user management, agent config
- **Database:** SQLite via better-sqlite3
- **Auth:** Passport.js + OAuth 2.0 (Google, GitHub), JWT tokens
- **Credentials:** keytar (secure OS keychain storage)

## Architecture

Three-process Electron model plus a separate backend:

**Main Process** (`src/main/`) — MCP server lifecycle (stdio/SSE/HTTP transports), SQLite operations, keytar credential storage, window management, IPC handler registration.

**Renderer Process** (`src/renderer/`) — React UI, Claude SDK API calls (direct HTTPS, not proxied through main), Zustand state management, MCP tool calls via IPC bridge to main.

**Preload Script** (`src/preload/`) — `contextBridge` exposes `window.nexus.{mcp, auth, db, app}` API surface to renderer. All main↔renderer communication goes through these typed IPC channels.

**Express Backend** (`server/`) — OAuth routes, JWT management, agent config loading from `agents.yml`, user profile CRUD. Runs as a separate process on port 3001.

## Planned Project Structure

```
src/main/               Electron main process
  mcp/                  MCP connection manager, transports, registry
  store/                SQLite db, session persistence, settings
  auth/                 Token manager (keytar)
src/renderer/           React app
  components/layout/    ActivityBar, Sidebar, MainPanel, Header, SidePanel
  components/chat/      ChatView, MessageBubble, ComposeBar, StreamingMessage
  components/agents/    AgentList, AgentAvatar, SessionPicker, McpConfigModal
  components/mcp-apps/  McpAppRenderer, AppPinButton, AppFullView, registry/
  stores/               Zustand stores (chat, agent, mcp, app, auth)
  services/             claude-service, mcp-bridge (IPC), api-client
  hooks/                useAgent, useMcpTools, useChat, useStreamingResponse
  types/                agent, chat, mcp, app
src/shared/             IPC channel constants and shared types
src/preload/            contextBridge API
server/                 Express backend (routes, middleware, services, db)
  agents.yml            Agent definitions
mcp-servers/            Mock MCP servers for development
  actioner-mock/        Mock CRM MCP server
```

## Key Concepts

### AI Agents
Four agents defined in `server/agents.yml`, each with a role, avatar symbol, accent color, and default MCP server bindings:
- **Nexus** (✦, `#8b5cf6`) — General assistant
- **Atlas** (◈, `#6366f1`) — Research & analysis
- **Muse** (◎, `#ec4899`) — Writing & creative
- **Forge** (⬡, `#f59e0b`) — Code & engineering

Agents always display a ⚡ badge to distinguish them from human users. Model: claude-sonnet-4-20250514.

### MCP Apps
When an AI agent returns structured data with `mcp_app_data`, it renders as an interactive component (DataTable, DetailView, ChartView, FormView) inside the chat bubble. Apps marked `pinnable` can be pinned to the activity bar for standalone access. The `McpAppRenderer` maps `type` → component from the registry.

### MCP Server Management
MCP servers are configured with three transport types: `stdio` (local), `sse` (remote streaming), `http` (remote). The `McpManager` in main process handles connect/disconnect lifecycle. Each agent has default MCP bindings but users can override per-agent via `McpConfigModal`.

### Layout
Three-column layout: ActivityBar (56px) | Sidebar (232px) | MainContent (flex) | optional SidePanel/Copilot (340px). Header is 52px. The prototype file is the authoritative reference for all visual patterns.

## Design Tokens

Background: `#0f0f1a` (main), `#12121f` (sidebar), `#0a0a14` (activity bar), `#161625` (cards/elevated)
Borders: `#1a1a2e` (default), `#2a2a44` (subtle)
Text: `#e2e2ee` (primary), `#9999aa` (secondary), `#5a5a70` (tertiary)
Font: `'DM Sans', 'Segoe UI', system-ui, sans-serif`, base 13.5px

## Reference Files

- `nexus-prd.md` — Complete specification including architecture, database schema, API contracts, UI specs, and phased implementation plan
- `nexus-prototype.jsx` — Single-file React prototype (~864 lines) serving as the visual and interaction reference for all UI components
