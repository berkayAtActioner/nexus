import { create } from 'zustand';
import { CopilotMessage } from '../../shared/types';

interface CopilotState {
  messages: CopilotMessage[];
  isStreaming: boolean;
  currentText: string;
  contextType: 'channel' | 'dm' | null;
  contextId: string | null;

  setContext: (type: 'channel' | 'dm', id: string) => void;
  loadMessages: (agentId: string, contextType: string, contextId: string) => Promise<void>;
  addMessage: (msg: CopilotMessage) => void;
  setStreaming: (isStreaming: boolean) => void;
  appendStreamToken: (token: string) => void;
  clearStreamText: () => void;
  reset: () => void;
}

export const useCopilotStore = create<CopilotState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentText: '',
  contextType: null,
  contextId: null,

  setContext: (type, id) => set({ contextType: type, contextId: id }),

  loadMessages: async (agentId, contextType, contextId) => {
    try {
      const messages = await window.nexus.db.getCopilotMessages(agentId, contextType, contextId);
      set({ messages, contextType: contextType as any, contextId });
    } catch (err) {
      console.error('Load copilot messages error:', err);
    }
  },

  addMessage: (msg) => set(state => ({ messages: [...state.messages, msg] })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamToken: (token) => set(state => ({ currentText: state.currentText + token })),

  clearStreamText: () => set({ currentText: '', isStreaming: false }),

  reset: () => set({ messages: [], isStreaming: false, currentText: '', contextType: null, contextId: null }),
}));
