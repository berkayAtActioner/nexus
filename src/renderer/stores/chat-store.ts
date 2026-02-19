import { create } from 'zustand';
import { ChatSession, ChatMessage, McpAppData, ToolCallDisplay } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { getStreamClient } from '../services/stream-client';
import { useAuthStore } from './auth-store';

interface StreamingState {
  isStreaming: boolean;
  currentText: string;
  activeToolCall?: { toolName: string; serverId: string } | null;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  streaming: StreamingState;
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  lastFailedMessage: { content: string } | null;
  sharedSessionIds: Set<string>;

  loadSessions: (agentId: string) => Promise<void>;
  createSession: (agentId: string, title?: string) => Promise<ChatSession>;
  setActiveSession: (sessionId: string) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  addUserMessage: (content: string) => Promise<ChatMessage>;
  addAssistantMessage: (content: string, toolCalls?: ToolCallDisplay[], mcpAppData?: McpAppData[]) => Promise<ChatMessage>;
  setStreaming: (streaming: Partial<StreamingState>) => void;
  appendStreamToken: (token: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  setLastFailedMessage: (msg: { content: string } | null) => void;
  isSharedSession: (sessionId: string) => boolean;
  addStreamMessage: (sessionId: string, message: ChatMessage) => void;
  reloadCurrentSessions: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  streaming: { isStreaming: false, currentText: '', activeToolCall: null },
  isLoadingSessions: false,
  isLoadingMessages: false,
  lastFailedMessage: null,
  sharedSessionIds: new Set<string>(),

  loadSessions: async (agentId: string) => {
    set({
      isLoadingSessions: true,
      activeSessionId: null,
      messages: [],
      streaming: { isStreaming: false, currentText: '', activeToolCall: null },
    });
    try {
      // 1) Local sessions from SQLite
      const localSessions = await window.nexus.db.getSessions(agentId);

      // 2) Stream shared sessions
      const client = getStreamClient();
      let streamSessions: ChatSession[] = [];
      const newSharedIds = new Set<string>();

      if (client?.userID) {
        try {
          const filter = {
            type: 'messaging' as const,
            id: { $autocomplete: 'ai-session-' },
            members: { $in: [client.userID] },
          };
          const channels = await client.queryChannels(filter, [{ last_message_at: -1 as const }], { limit: 50 });

          for (const ch of channels) {
            const data = ch.data as any;
            if (data?.agentId !== agentId) continue;

            const sid = data.sessionId || ch.id?.replace('ai-session-', '') || ch.id;
            newSharedIds.add(sid);

            streamSessions.push({
              id: sid,
              user_id: data.created_by_id || client.userID,
              agent_id: agentId,
              title: data.name || 'Shared Session',
              created_at: data.created_at || new Date().toISOString(),
              updated_at: data.updated_at || new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn('[ChatStore] Failed to load Stream sessions:', err);
        }
      }

      // 3) Merge — Stream wins on duplicates
      const streamIds = new Set(streamSessions.map(s => s.id));
      const merged = [
        ...streamSessions,
        ...localSessions.filter(s => !streamIds.has(s.id)),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      set({ sessions: merged, isLoadingSessions: false, sharedSessionIds: newSharedIds });

      // Auto-select the most recent session
      if (merged.length > 0) {
        await get().setActiveSession(merged[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ sessions: [], isLoadingSessions: false });
    }
  },

  createSession: async (agentId: string, title?: string) => {
    const session = await window.nexus.db.createSession(agentId, title || 'New Chat');
    set(state => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
      messages: [],
    }));
    return session;
  },

  setActiveSession: async (sessionId: string) => {
    set({ activeSessionId: sessionId, messages: [] });
    await get().loadMessages(sessionId);
  },

  loadMessages: async (sessionId: string) => {
    set({ isLoadingMessages: true });
    const { sharedSessionIds } = get();

    if (sharedSessionIds.has(sessionId)) {
      // Load from Stream channel
      try {
        const client = getStreamClient();
        if (client) {
          const channelId = `ai-session-${sessionId}`;
          const channel = client.channel('messaging', channelId);
          await channel.watch();

          const streamMessages = (channel.state.messages || []).map(msg => {
            const custom = msg as any;
            return {
              id: msg.id || uuidv4(),
              session_id: sessionId,
              role: (custom.role || 'user') as 'user' | 'assistant' | 'system',
              sender_name: custom.sender_name || msg.user?.name || null,
              content: msg.text || '',
              mcp_app_data: custom.mcp_app_data || null,
              attachments: null,
              tool_calls: custom.tool_calls || null,
              created_at: custom.original_created_at || msg.created_at?.toString() || new Date().toISOString(),
            } as ChatMessage;
          });

          set({ messages: streamMessages, isLoadingMessages: false });
          return;
        }
      } catch (err) {
        console.warn('[ChatStore] Failed to load Stream messages, falling back to SQLite:', err);
      }
    }

    // Load from local SQLite
    try {
      const messages = await window.nexus.db.getMessages(sessionId);
      set({ messages, isLoadingMessages: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  addUserMessage: async (content: string) => {
    const { activeSessionId, sessions, sharedSessionIds } = get();
    if (!activeSessionId) throw new Error('No active session');

    if (sharedSessionIds.has(activeSessionId)) {
      // Send to Stream channel
      const client = getStreamClient();
      if (client) {
        const channelId = `ai-session-${activeSessionId}`;
        const channel = client.channel('messaging', channelId);
        const currentUser = useAuthStore.getState().currentUser;

        const res = await channel.sendMessage({
          text: content,
          role: 'user',
          sender_name: currentUser?.name || 'User',
          tool_calls: '',
          mcp_app_data: '',
        } as any);

        const msg: ChatMessage = {
          id: res.message.id || uuidv4(),
          session_id: activeSessionId,
          role: 'user',
          sender_name: currentUser?.name || null,
          content,
          mcp_app_data: null,
          attachments: null,
          tool_calls: null,
          created_at: res.message.created_at?.toString() || new Date().toISOString(),
        };
        set(state => ({ messages: [...state.messages, msg] }));

        // Auto-generate title from first message
        const session = sessions.find(s => s.id === activeSessionId);
        if (session && session.title === 'New Chat') {
          const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
          await get().updateSessionTitle(activeSessionId, title);
        }

        return msg;
      }
    }

    // Local SQLite path
    const msg = await window.nexus.db.saveMessage({
      id: uuidv4(),
      session_id: activeSessionId,
      role: 'user',
      content,
    });
    set(state => ({ messages: [...state.messages, msg] }));

    // Auto-generate title from first message
    const session = sessions.find(s => s.id === activeSessionId);
    if (session && session.title === 'New Chat') {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
      await get().updateSessionTitle(activeSessionId, title);
    }

    return msg;
  },

  addAssistantMessage: async (content: string, toolCalls?: ToolCallDisplay[], mcpAppData?: McpAppData[]) => {
    const { activeSessionId, sharedSessionIds } = get();
    if (!activeSessionId) throw new Error('No active session');

    if (sharedSessionIds.has(activeSessionId)) {
      // Send to Stream channel
      const client = getStreamClient();
      if (client) {
        const channelId = `ai-session-${activeSessionId}`;
        const channel = client.channel('messaging', channelId);

        const res = await channel.sendMessage({
          text: content,
          role: 'assistant',
          sender_name: 'Assistant',
          tool_calls: toolCalls?.length ? JSON.stringify(toolCalls) : '',
          mcp_app_data: mcpAppData?.length ? JSON.stringify(mcpAppData) : '',
        } as any);

        const msg: ChatMessage = {
          id: res.message.id || uuidv4(),
          session_id: activeSessionId,
          role: 'assistant',
          sender_name: 'Assistant',
          content,
          mcp_app_data: mcpAppData?.length ? JSON.stringify(mcpAppData) : null,
          attachments: null,
          tool_calls: toolCalls?.length ? JSON.stringify(toolCalls) : null,
          created_at: res.message.created_at?.toString() || new Date().toISOString(),
        };
        set(state => ({
          messages: [...state.messages, msg],
          streaming: { isStreaming: false, currentText: '', activeToolCall: null },
        }));
        return msg;
      }
    }

    // Local SQLite path
    const msg = await window.nexus.db.saveMessage({
      id: uuidv4(),
      session_id: activeSessionId,
      role: 'assistant',
      content,
      tool_calls: toolCalls?.length ? JSON.stringify(toolCalls) : undefined,
      mcp_app_data: mcpAppData?.length ? JSON.stringify(mcpAppData) : undefined,
    });
    set(state => ({
      messages: [...state.messages, msg],
      streaming: { isStreaming: false, currentText: '', activeToolCall: null },
    }));
    return msg;
  },

  setStreaming: (streaming: Partial<StreamingState>) => {
    set(state => ({ streaming: { ...state.streaming, ...streaming } }));
  },

  appendStreamToken: (token: string) => {
    set(state => ({
      streaming: {
        ...state.streaming,
        currentText: state.streaming.currentText + token,
      },
    }));
  },

  deleteSession: async (sessionId: string) => {
    await window.nexus.db.deleteSession(sessionId);
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== sessionId);
      const activeSessionId = state.activeSessionId === sessionId
        ? (sessions[0]?.id || null)
        : state.activeSessionId;
      return { sessions, activeSessionId, messages: activeSessionId !== state.activeSessionId ? [] : state.messages };
    });
  },

  setLastFailedMessage: (msg) => set({ lastFailedMessage: msg }),

  updateSessionTitle: async (sessionId: string, title: string) => {
    // Update locally in SQLite (best effort — may not exist for shared-only sessions)
    try {
      await window.nexus.db.updateSessionTitle(sessionId, title);
    } catch {
      // Shared session — not in local DB, that's fine
    }
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, title } : s
      ),
    }));
  },

  isSharedSession: (sessionId: string) => {
    return get().sharedSessionIds.has(sessionId);
  },

  addStreamMessage: (sessionId: string, message: ChatMessage) => {
    const { activeSessionId, messages } = get();
    if (activeSessionId !== sessionId) return;
    // Deduplicate by id
    if (messages.some(m => m.id === message.id)) return;
    set(state => ({ messages: [...state.messages, message] }));
  },

  reloadCurrentSessions: async () => {
    const { sessions } = get();
    if (sessions.length > 0) {
      // Find the agent from first session
      const agentId = sessions[0]?.agent_id;
      if (agentId) {
        // Reload without resetting active session
        const client = getStreamClient();
        let streamSessions: ChatSession[] = [];
        const newSharedIds = new Set<string>();

        if (client?.userID) {
          try {
            const filter = {
              type: 'messaging' as const,
              id: { $autocomplete: 'ai-session-' },
              members: { $in: [client.userID] },
            };
            const channels = await client.queryChannels(filter, [{ last_message_at: -1 as const }], { limit: 50 });
            for (const ch of channels) {
              const data = ch.data as any;
              if (data?.agentId !== agentId) continue;
              const sid = data.sessionId || ch.id?.replace('ai-session-', '') || ch.id;
              newSharedIds.add(sid);
              streamSessions.push({
                id: sid,
                user_id: data.created_by_id || client.userID,
                agent_id: agentId,
                title: data.name || 'Shared Session',
                created_at: data.created_at || new Date().toISOString(),
                updated_at: data.updated_at || new Date().toISOString(),
              });
            }
          } catch (err) {
            console.warn('[ChatStore] Reload Stream sessions failed:', err);
          }
        }

        const localSessions = await window.nexus.db.getSessions(agentId);
        const streamIds = new Set(streamSessions.map(s => s.id));
        const merged = [
          ...streamSessions,
          ...localSessions.filter(s => !streamIds.has(s.id)),
        ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        set({ sessions: merged, sharedSessionIds: newSharedIds });
      }
    }
  },
}));
