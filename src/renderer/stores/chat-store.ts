import { create } from 'zustand';
import { ChatSession, ChatMessage, McpAppData, ToolCallDisplay } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

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
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  streaming: { isStreaming: false, currentText: '', activeToolCall: null },
  isLoadingSessions: false,
  isLoadingMessages: false,
  lastFailedMessage: null,

  loadSessions: async (agentId: string) => {
    set({
      isLoadingSessions: true,
      activeSessionId: null,
      messages: [],
      streaming: { isStreaming: false, currentText: '', activeToolCall: null },
    });
    try {
      const sessions = await window.nexus.db.getSessions(agentId);
      set({ sessions, isLoadingSessions: false });
      // Auto-select the most recent session
      if (sessions.length > 0) {
        await get().setActiveSession(sessions[0].id);
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
    try {
      const messages = await window.nexus.db.getMessages(sessionId);
      set({ messages, isLoadingMessages: false });
    } catch (error) {
      console.error('Failed to load messages:', error);
      set({ isLoadingMessages: false });
    }
  },

  addUserMessage: async (content: string) => {
    const { activeSessionId, sessions } = get();
    if (!activeSessionId) throw new Error('No active session');

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
    const { activeSessionId } = get();
    if (!activeSessionId) throw new Error('No active session');

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
    await window.nexus.db.updateSessionTitle(sessionId, title);
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId ? { ...s, title } : s
      ),
    }));
  },
}));
