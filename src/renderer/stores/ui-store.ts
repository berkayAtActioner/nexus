import { create } from 'zustand';
import { PinnedApp } from '../../shared/types';

type ActiveView =
  | { type: 'agent-dm'; agentId: string }
  | { type: 'pinned-app'; appId: string }
  | { type: 'channel'; channelId: string }
  | { type: 'human-dm'; userId: string };

type SidebarSection = 'channels' | 'people' | 'agents';

interface UIState {
  sidebarSection: SidebarSection;
  activeView: ActiveView;
  pinnedApps: PinnedApp[];
  settingsOpen: boolean;
  copilotOpen: boolean;
  copilotAgentId: string | null;

  setSidebarSection: (section: SidebarSection) => void;
  setActiveView: (view: ActiveView) => void;
  openSettings: () => void;
  closeSettings: () => void;
  pinApp: (app: PinnedApp) => void;
  unpinApp: (id: string) => void;
  loadPinnedApps: () => Promise<void>;
  savePinnedApps: () => Promise<void>;
  openCopilot: (agentId: string) => void;
  closeCopilot: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarSection: 'agents',
  activeView: { type: 'agent-dm', agentId: 'nexus' },
  pinnedApps: [],
  settingsOpen: false,
  copilotOpen: false,
  copilotAgentId: null,

  setSidebarSection: (section) => set({ sidebarSection: section }),
  setActiveView: (view) => {
    // Auto-switch sidebar section based on view type
    const section = view.type === 'channel' ? 'channels' : view.type === 'human-dm' ? 'people' : 'agents';
    set({ activeView: view, sidebarSection: section });
  },
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  pinApp: (app) => {
    const current = get().pinnedApps;
    if (current.some(p => p.id === app.id)) return;
    set({ pinnedApps: [...current, app] });
    get().savePinnedApps();
  },

  unpinApp: (id) => {
    const current = get().pinnedApps;
    const updated = current.filter(p => p.id !== id);
    set({ pinnedApps: updated });
    const view = get().activeView;
    if (view.type === 'pinned-app' && view.appId === id) {
      set({ activeView: { type: 'agent-dm', agentId: 'nexus' } });
    }
    get().savePinnedApps();
  },

  loadPinnedApps: async () => {
    try {
      const settings = await window.nexus.settings.get();
      if (settings?.pinned_app_order) {
        const apps = JSON.parse(settings.pinned_app_order);
        if (Array.isArray(apps)) {
          set({ pinnedApps: apps });
        }
      }
    } catch (error) {
      console.error('Failed to load pinned apps:', error);
    }
  },

  savePinnedApps: async () => {
    try {
      const apps = get().pinnedApps;
      await window.nexus.settings.update({ pinned_app_order: JSON.stringify(apps) });
    } catch (error) {
      console.error('Failed to save pinned apps:', error);
    }
  },

  openCopilot: (agentId) => set({ copilotOpen: true, copilotAgentId: agentId }),
  closeCopilot: () => set({ copilotOpen: false, copilotAgentId: null }),
}));
