import { create } from 'zustand';
import { AgentConfig } from '../../shared/types';
import { apiFetch } from '../services/api-client';

// Agent configs from API don't include systemPrompt (stripped by server)
type ClientAgent = Omit<AgentConfig, 'systemPrompt'>;

interface AgentState {
  agents: ClientAgent[];
  activeAgentId: string | null;
  isLoading: boolean;
  fetchAgents: () => Promise<void>;
  setActiveAgent: (id: string) => void;
  getActiveAgent: () => ClientAgent | undefined;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  activeAgentId: null,
  isLoading: true,

  fetchAgents: async () => {
    try {
      const agents = await apiFetch<ClientAgent[]>('/agents');
      set({ agents, isLoading: false });
      // Set default active agent to the general agent
      if (!get().activeAgentId && agents.length > 0) {
        const general = agents.find(a => a.isGeneral) || agents[0];
        set({ activeAgentId: general.id });
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      set({ isLoading: false });
    }
  },

  setActiveAgent: (id: string) => {
    set({ activeAgentId: id });
  },

  getActiveAgent: () => {
    const { agents, activeAgentId } = get();
    return agents.find(a => a.id === activeAgentId);
  },
}));
