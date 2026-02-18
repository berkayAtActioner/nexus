import { create } from 'zustand';
import { WorkspaceUser, AuthTokens, StreamConfig } from '../../shared/types';
import { apiFetch } from '../services/api-client';

interface AuthState {
  apiKey: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentUser: WorkspaceUser | null;
  jwt: string | null;
  refreshToken: string | null;
  streamToken: string | null;
  streamConfig: StreamConfig | null;

  loadSettings: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  login: (params: Record<string, string>) => void;
  logout: () => void;
  refreshJwt: () => Promise<void>;
  fetchStreamConfig: () => Promise<void>;
  ensureStreamToken: () => Promise<void>;
  getUserId: () => string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  apiKey: null,
  isLoading: true,
  isAuthenticated: false,
  currentUser: null,
  jwt: null,
  refreshToken: null,
  streamToken: null,
  streamConfig: null,

  loadSettings: async () => {
    try {
      // Check for stored auth tokens
      const storedAuth = localStorage.getItem('nexus_auth');
      if (storedAuth) {
        try {
          const auth = JSON.parse(storedAuth);
          set({
            jwt: auth.jwt,
            refreshToken: auth.refreshToken,
            streamToken: auth.streamToken,
            currentUser: auth.currentUser,
            isAuthenticated: true,
          });
        } catch {}
      }

      const userId = get().getUserId();
      const settings = await window.nexus.settings.get(userId);
      set({ apiKey: settings.api_key, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  setApiKey: async (key: string) => {
    const userId = get().getUserId();
    await window.nexus.settings.update({ api_key: key }, userId);
    set({ apiKey: key });
  },

  login: (params: Record<string, string>) => {
    if (params.error) {
      console.error('Auth error:', params.error);
      return;
    }

    const user: WorkspaceUser = {
      id: params.userId,
      email: params.email,
      name: params.name,
      avatar_url: params.avatar || null,
      provider: 'oauth',
    };

    const authData = {
      jwt: params.token,
      refreshToken: params.refreshToken,
      streamToken: params.streamToken,
      currentUser: user,
    };

    localStorage.setItem('nexus_auth', JSON.stringify(authData));

    set({
      jwt: params.token,
      refreshToken: params.refreshToken,
      streamToken: params.streamToken,
      currentUser: user,
      isAuthenticated: true,
    });

    // Ensure user settings exist for the new user
    window.nexus.settings.get(user.id).catch(() => {});
  },

  logout: () => {
    localStorage.removeItem('nexus_auth');
    // Disconnect Stream
    import('../stores/stream-store').then(m => m.useStreamStore.getState().disconnect());
    // Reset view to default
    import('../stores/ui-store').then(m => m.useUIStore.getState().setActiveView({ type: 'agent-dm', agentId: 'nexus' }));
    set({
      jwt: null,
      refreshToken: null,
      streamToken: null,
      currentUser: null,
      isAuthenticated: false,
    });
  },

  refreshJwt: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return;

    try {
      const data = await apiFetch<{ token: string; streamToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      set({ jwt: data.token, streamToken: data.streamToken });

      // Update localStorage
      const storedAuth = localStorage.getItem('nexus_auth');
      if (storedAuth) {
        const auth = JSON.parse(storedAuth);
        auth.jwt = data.token;
        auth.streamToken = data.streamToken;
        localStorage.setItem('nexus_auth', JSON.stringify(auth));
      }
    } catch {
      // Refresh failed, logout
      get().logout();
    }
  },

  fetchStreamConfig: async () => {
    try {
      const config = await apiFetch<StreamConfig>('/stream/config');
      set({ streamConfig: config });
    } catch {
      set({ streamConfig: { configured: false } });
    }
  },

  ensureStreamToken: async () => {
    const { streamToken, refreshToken, currentUser, streamConfig } = get();
    // Only act if Stream is configured but we're missing a token
    if (streamToken || !streamConfig?.configured || !currentUser) return;

    // Try refresh first (works for OAuth users)
    if (refreshToken) {
      try {
        await get().refreshJwt();
        return;
      } catch {
        // Fall through to dev-login
      }
    }

    // Fall back to dev-login (works for dev users without refreshToken)
    try {
      const res = await fetch('http://localhost:3001/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser.name,
          userId: currentUser.id,
          email: currentUser.email,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.streamToken) {
          set({
            jwt: data.token || get().jwt,
            refreshToken: data.refreshToken || get().refreshToken,
            streamToken: data.streamToken,
          });
          // Update localStorage
          const storedAuth = localStorage.getItem('nexus_auth');
          if (storedAuth) {
            const auth = JSON.parse(storedAuth);
            auth.jwt = data.token || auth.jwt;
            auth.refreshToken = data.refreshToken || auth.refreshToken;
            auth.streamToken = data.streamToken;
            localStorage.setItem('nexus_auth', JSON.stringify(auth));
          }
        }
      }
    } catch {
      // Server not available — Stream will stay disconnected
    }
  },

  getUserId: () => {
    const { currentUser } = get();
    return currentUser?.id || 'local-user-1';
  },
}));
